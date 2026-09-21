import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastError } from "@/shared/utils/toastError";
import { getCompanyDocumentHeader } from "@/shared/services/companyHeader";
import { allQuotationServicesApi } from "@/modules/quotations/services/Quotations.service";
import { openServiceOrderPdf } from "@/modules/quotations/utils/serviceOrderPdf";
import { useProductionOrderServices } from "../../hooks/useProductionOrderServices";
import { ServiceProcesses } from "../../types/productionOrderProcesses.types";

interface ProductionOrderServicesProps {
  productionOrderId: number;
  /** OP-0028. Va en el papel como la orden de la que sale el encargo. */
  productionOrderCode?: string | null;
  /** Sube al guardar la ruta o vincular servicios: la lista se relee. */
  reloadKey?: number;
}

/** Una cotización de la orden: el taller, lo que se le encarga y su papel. */
interface EncargoRow {
  /** Null mientras el backend no la devuelva: entonces la fila es el taller. */
  quotationId: number | null;
  quotationCode: string | null;
  quotationDescription: string;
  /** Las notas de la cotización: Observaciones del papel. */
  quotationNotes: string | null;
  /** Moneda pactada (ISO) y condición de pago: las imprime el papel. */
  currency: string | null;
  paymentTerms: string | null;
  supplierId: number | null;
  supplierName: string;
  createdAt: string | null;
  /** Los procesos que cubren sus servicios, sin repetir. */
  processes: string;
  services: ServiceProcesses[];
  total: number;
}

/**
 * Con qué se identifica una fila: su cotización, o su taller cuando el backend
 * todavía no devuelve la cotización.
 */
const claveDe = (encargo: {
  quotationId: number | null;
  supplierId: number | null;
  services: ServiceProcesses[];
}): string =>
  encargo.quotationId !== null
    ? `q${encargo.quotationId}`
    : `s${encargo.supplierId ?? encargo.services[0]?.supplierServiceId}`;

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);

/**
 * Los encargos de taller de la orden, con su papel.
 *
 * Es el espejo de «Compras de esta orden» en la explosión, y se agrupa igual:
 * **una fila es una cotización**, que en este modelo es un proveedor —
 * `supplier_service_quotations` tiene un solo `supplier_id`—.
 *
 * No una fila por servicio. Lo que se le encarga a un taller es el conjunto —
 * cortar, coser, estampar—, así que la Orden de Servicio sale **una por
 * cotización con todas sus líneas**: un papel por servicio obligaría a mandarle
 * tres documentos para un mismo encargo y ninguno diría cuánto suma.
 *
 * Las líneas del papel NO se toman de esta tabla: se piden completas al
 * imprimir, como hace el botón de Cotizaciones. Aquí solo están los servicios
 * que entraron a ESTA orden, y una orden de servicio que imprimiera un
 * subconjunto se contradiría con la cotización que el proveedor tiene.
 */
export const ProductionOrderServices = ({
  productionOrderId,
  productionOrderCode = null,
  reloadKey = 0,
}: ProductionOrderServicesProps) => {
  const { services, items, loading } = useProductionOrderServices(
    productionOrderId,
    reloadKey,
  );

  /** Qué cotización se está imprimiendo: el spinner es de su fila. */
  const [imprimiendo, setImprimiendo] = useState<string | null>(null);

  const encargos = useMemo<EncargoRow[]>(() => {
    const porCotizacion = new Map<string, EncargoRow>();

    for (const service of services) {
      // Sin cotización se agrupa por PROVEEDOR, que es lo mismo salvo en el
      // nombre: una cotización tiene un solo `supplier_id`, así que dos
      // servicios del mismo taller en esta orden son el mismo encargo.
      //
      // Existe porque el id de la cotización lo trae una versión reciente del
      // backend, y sin este camino la lista entera desaparecía en cuanto
      // faltaba: un dato ausente puede degradar la fila, nunca borrar el
      // bloque. El proveedor sí está desde siempre.
      const clave =
        service.supplierQuotationId !== null
          ? `q${service.supplierQuotationId}`
          : `s${service.supplierId ?? service.supplierServiceId}`;

      const actual = porCotizacion.get(clave);
      if (actual) {
        actual.services.push(service);
        actual.total += service.price ?? 0;
      } else {
        porCotizacion.set(clave, {
          quotationId: service.supplierQuotationId,
          quotationCode: service.quotationCode,
          quotationDescription: service.quotationDescription,
          quotationNotes: service.quotationNotes,
          currency: service.currency,
          paymentTerms: service.paymentTerms,
          supplierId: service.supplierId,
          supplierName: service.supplierName ?? "—",
          createdAt: service.quotationCreatedAt,
          processes: "",
          services: [service],
          total: service.price ?? 0,
        });
      }
    }

    // Los procesos, al final y sobre el grupo ya armado: son los de todos sus
    // servicios juntos, sin repetir.
    return [...porCotizacion.values()].map((encargo) => ({
      ...encargo,
      processes: [
        ...new Set(
          encargo.services
            .flatMap((service) => service.steps.map((step) => step.processName))
            .filter((name): name is string => !!name),
        ),
      ].join(", "),
    }));
  }, [services]);

  const handlePrint = async (encargo: EncargoRow) => {
    try {
      setImprimiendo(claveDe(encargo));

      // Las líneas completas de la cotización, no las de esta orden: el papel
      // tiene que coincidir con lo que el proveedor tiene cotizado.
      //
      // Sin id de cotización no hay a qué pedírselas, así que se cae a los
      // servicios que esta orden ya tiene de ese taller. El papel sale más
      // corto —le faltarían las líneas de otras órdenes, si las hubiera— pero
      // sale, que es mejor que un botón que no hace nada.
      const [company, lines] = await Promise.all([
        getCompanyDocumentHeader(),
        encargo.quotationId === null
          ? Promise.resolve(null)
          : allQuotationServicesApi(encargo.quotationId, "SERVICE"),
      ]);

      /**
       * Las prendas que cubren sus servicios en ESTA orden.
       *
       * Salen de la matriz paso × prenda. Que algún servicio no tenga
       * atribución explícita significa **todas**, que es lo que ya asume el
       * resto de la ruta.
       */
      const cubreTodo = encargo.services.some((service) =>
        service.steps.some((step) => step.productionOrderItemIds.length === 0),
      );
      const ids = new Set(
        encargo.services.flatMap((service) =>
          service.steps.flatMap((step) => step.productionOrderItemIds),
        ),
      );
      const prendas = cubreTodo
        ? items
        : items.filter((item) => ids.has(item.id));

      openServiceOrderPdf({
        quotationCode: encargo.quotationCode,
        processName: encargo.processes || null,
        quotationDescription: encargo.quotationDescription,
        quotationNotes: encargo.quotationNotes,
        currency: encargo.currency,
        paymentTerms: encargo.paymentTerms,
        // La de la cotizacion, no la de hoy: es la que imprime tambien
        // QuotationDetail para este mismo papel.
        createdAt: encargo.createdAt ?? new Date().toISOString(),
        promisedDate: null,
        supplierName: encargo.supplierName,
        supplierDocument:
          encargo.services[0]?.supplierDocumentNumber ?? null,
        supplierPhone: encargo.services[0]?.supplierPhone ?? null,
        company,
        productionOrderNames: productionOrderCode ? [productionOrderCode] : [],
        // Lo PEDIDO en las dos ramas, no lo último registrado: tras un avance
        // ya no es lo que se encargó.
        lines:
          lines === null
            ? encargo.services.map((service) => ({
                code: service.serviceCode,
                description: service.serviceDescription,
                quantity: service.requestedQuantity,
                measurementUnit: service.measurementUnit,
                price: service.price,
                // Sin declarar: sp_get_production_order_processes no devuelve
                // price_includes_tax, asi que por esta via el papel sale sin
                // desglose. Es la rama de respaldo --sin id de cotizacion-- y
                // se arregla exponiendolo en ese lector.
                includesTax: null,
              }))
            : lines.map((line) => ({
                code: line.code,
                description: line.description,
                quantity: line.requested_quantity,
                measurementUnit: line.last_situation?.measurement_unit ?? null,
                price: line.last_situation?.price ?? null,
                includesTax: line.price_includes_tax ?? null,
              })),
        garments: prendas.map((item) => ({
          label: item.name,
          sku: item.sku,
          quantity: item.quantity,
          // La talla por separado: la rejilla del papel la pone en columna.
          productTitle: item.productTitle,
          sizeTermId: item.sizeTermId,
          sizeTerm: item.sizeTerm,
          sizeGroup: item.sizeGroup,
          otherTerms: item.otherTerms,
        })),
      });
    } catch (error) {
      toastError(error, "No se pudo generar la orden de servicio");
    } finally {
      setImprimiendo(null);
    }
  };

  // Sin encargos no se pinta nada: la orden puede tener la ruta armada y aún
  // sin cotizar, y un bloque vacío solo ocuparía sitio.
  if (loading || encargos.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold">Servicios de esta orden</h3>
        <p className="text-muted-foreground text-xs">
          Uno por taller. Cada uno se imprime como orden de servicio, con todas
          sus líneas.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cotización</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Procesos</TableHead>
              <TableHead className="text-right">Servicios</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {encargos.map((encargo) => (
              <TableRow key={claveDe(encargo)}>
                <TableCell className="font-medium">
                  {/* Sin código no se repite el proveedor, que ya está en su
                      columna: la fila se identifica por él igualmente. */}
                  {encargo.quotationCode || "—"}
                  {encargo.quotationDescription && (
                    <div className="text-muted-foreground text-xs font-normal">
                      {encargo.quotationDescription}
                    </div>
                  )}
                </TableCell>
                <TableCell>{encargo.supplierName}</TableCell>
                <TableCell>{encargo.processes || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {encargo.services.length}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(encargo.total)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    disabled={imprimiendo !== null}
                    onClick={() => handlePrint(encargo)}
                    title="Imprimir la orden de servicio de este taller"
                  >
                    {imprimiendo === claveDe(encargo) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Orden de servicio
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
