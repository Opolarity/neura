import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, PackageCheck, Printer, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { getCompanyDocumentHeader } from "@/shared/services/companyHeader";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateTime } from "@/shared/utils/date";
import { fetchServiceSituationHistory } from "@/modules/quotations/services/Quotations.service";
import { ServiceSituationHistoryItem } from "@/modules/quotations/types/Quotations.types";
import { openServiceOrderPdf } from "@/modules/quotations/utils/serviceOrderPdf";
import { ServiceProgressTarget } from "../../hooks/useServiceProgress";
import { ProductionPlanProcessCellData } from "../../types/productionPlan.types";
import {
  openProductionRemisionGuide,
  productionGuideNumber,
  ProductionGuideContext,
} from "../../utils/productionRemisionGuide";

interface ProcessDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * El servicio del paso, ya en la forma que pide la guía de remisión.
   *
   * El grid lo mapea desde la fila con el mismo mapeador que alimenta el
   * diálogo de avance: dos formas del mismo servicio se habrían separado.
   */
  service: ServiceProgressTarget | null;
  /** Cómo se llama el proceso, para el encabezado. */
  processName: string;
  /** La prenda: sus cifras en ESTE proceso. */
  celda: ProductionPlanProcessCellData | null;
  /**
   * OP-0028. Va en la guía --es por donde se rastrea el envío-- y en la orden
   * de servicio.
   */

  productionOrderCode?: string | null;
  productionOrderItemId: number;
  /** Cómo se llama la prenda. */
  itemLabel: string;
  /**
   * El paso ANTERIOR de esta prenda y el SIGUIENTE, con sus servicios.
   *
   * Null en los extremos: sin anterior, la prenda salió de almacén; sin
   * siguiente, este proceso es el último y lo que sale vuelve a almacén.
   */
  previous?: { processName: string; service: ServiceProgressTarget } | null;
  next?: { processName: string; service: ServiceProgressTarget } | null;
  /** Se ejecuta al pedir el pago; sin él, el botón no se pinta. */
  onPay?: (service: ServiceProgressTarget) => void;
}

const num = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/** Un dato con su rótulo, para la rejilla de arriba. */
const Dato = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-0.5">
    <div className="text-muted-foreground text-xs">{label}</div>
    <div className="text-sm font-medium tabular-nums">{children}</div>
  </div>
);

/**
 * Una pierna del recorrido: con qué papel llegó la prenda, y con cuál se va.
 *
 * La guía se emite hacia el taller DESTINO, así que el papel con el que este
 * proceso recibió la mercadería es el de SU propio servicio, y el de la
 * siguiente pierna es el del servicio que viene después. Esa es toda la
 * cadena: cada paso tiene su guía, y la del vecino dice de dónde vino o a
 * dónde va.
 *
 * Lleva el número delante porque es lo que se compara contra el bulto que está
 * en la mesa; el proceso y el taller van debajo, como contexto.
 */
const Tramo = ({
  rotulo,
  icono,
  service,
  desde,
  hasta,
  cantidad,
  itemId,
  contexto,
  vacio,
  accion,
  destacado = false,
}: {
  rotulo: string;
  icono: React.ReactNode;
  /** El servicio al que va dirigida la guía. Null = no hay esa pierna. */
  service: ServiceProgressTarget | null;
  /** De dónde salió la mercadería en esta pierna. */
  desde?: string;
  /** A dónde va. */
  hasta?: string;
  /** Lo que viaja. Sin cantidad no hay guía que imprimir. */
  cantidad: number | null;
  itemId: number;
  /** De qué orden, de qué proceso a qué proceso y cuándo. Va en el papel. */
  contexto: ProductionGuideContext;
  vacio: string;
  accion: string;
  destacado?: boolean;
}) => (
  <div
    className={
      destacado
        ? "bg-muted/50 space-y-1.5 rounded-md border p-3"
        : "space-y-1.5 rounded-md border p-3"
    }
  >
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
      {icono}
      {rotulo}
    </div>

    {!service ? (
      <p className="text-muted-foreground text-sm">{vacio}</p>
    ) : (
      <>
        <div className="font-mono text-sm font-semibold">
          {productionGuideNumber(service.id)}
        </div>
        <div className="text-muted-foreground text-xs">
          {[desde, hasta].filter(Boolean).join(" → ")}
          {service.supplierName ? ` · ${service.supplierName}` : ""}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!cantidad}
          title={
            cantidad
              ? undefined
              : "Todavía no hay cantidad que declarar en esta guía"
          }
          onClick={() =>
            openProductionRemisionGuide(
              [{ service, itemId, quantity: Number(cantidad ?? 0) }],
              contexto,
            )
          }
        >
          <Printer className="h-3.5 w-3.5" />
          {accion}
        </Button>
      </>
    )}
  </div>
);

/**
 * Lo que hay que saber de un proceso ya avanzado, para esta prenda.
 *
 * Sustituye al historial suelto que abría antes la píldora «Avanzado». El
 * historial sigue estando abajo —es de donde salen las fechas— pero lo que se
 * viene a preguntar al pulsar un proceso terminado no es la lista de
 * movimientos: es cuánto se pidió, cuánto llegó y cuándo se cerró. Los
 * movimientos son el respaldo de esas cifras, no la respuesta.
 *
 * Llevó un cuadro de consumo de materiales --el planificado, la receta por las
 * prendas de la fila-- y se retiró: la pregunta que se hace aquí es por dónde
 * va la prenda, no de qué está hecha. El consumo se ve en la explosión de la
 * orden, que es donde se compra.
 */
export const ProcessDetailDialog = ({
  open,
  onOpenChange,
  service,
  processName,
  celda,
  productionOrderCode = null,
  productionOrderItemId,
  itemLabel,
  previous = null,
  next = null,
  onPay,
}: ProcessDetailDialogProps) => {
  const [history, setHistory] = useState<ServiceSituationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);

  // Una sola consulta. Eran dos: la otra traía el requerimiento de materiales
  // de la orden ENTERA para sacar de él el consumo de esta prenda, que ya no
  // se pinta aquí.
  /**
   * El historial, que es de donde salen las fechas y ahora también los
   * papeles de cada movimiento. Se relee al adjuntar o quitar uno: lo subido
   * no se pinta a mano, se vuelve a preguntar.
   */
  const cargarHistorial = useCallback(async () => {
    if (!service) return;
    try {
      setLoading(true);
      setHistory(await fetchServiceSituationHistory(service.id));
    } catch {
      setHistory([]);
      toast({
        title: "No se pudo cargar el detalle del proceso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (!open || !service) return;
    cargarHistorial();
  }, [open, service, cargarHistorial]);

  if (!service) return null;

  // Las fechas salen del historial, que es donde de verdad están: cada cambio
  // de situación dejó la suya. El primero es cuándo empezó a moverse y el
  // último, cuándo se cerró.
  const primero = history[0] ?? null;
  const ultimo = history.length > 0 ? history[history.length - 1] : null;

  /**
   * La Orden de Servicio de ESTE servicio, no de su cotización.
   *
   * Es el papel del taller que se tiene delante. Si la cotización lleva corte,
   * costura y estampado en tres talleres, imprimir los tres desde aquí sería
   * mandarle al de corte el precio de los otros dos. El botón de Cotizaciones
   * sigue sacando la cotización entera, que es donde eso sí tiene sentido.
   *
   * Los datos del proveedor salen del servicio —ya vienen con él, es lo que
   * alimenta la guía de remisión— y de la empresa, de `shared`. El teléfono no
   * está en el servicio, así que ese rótulo no se imprime en vez de salir
   * vacío.
   */
  const handlePrintServiceOrder = async () => {
    try {
      setImprimiendo(true);
      const company = await getCompanyDocumentHeader();

      openServiceOrderPdf({
        quotationCode: null,
        serviceCode: service.code,
        processName,
        quotationDescription: service.description,
        currency: service.currency,
        paymentTerms: service.paymentTerms,
        // El historial es de dónde salen las fechas reales; el primero es
        // cuándo empezó a moverse. Sin historial, hoy.
        createdAt: primero?.created_at ?? new Date().toISOString(),
        promisedDate: null,
        supplierName: service.supplierName ?? "—",
        supplierDocument: service.supplierDocumentNumber,
        supplierPhone: null,
        company,
        productionOrderNames: productionOrderCode ? [productionOrderCode] : [],
        lines: [
          {
            code: service.code,
            description: service.description,
            // Lo PEDIDO, no lo último registrado: tras un avance,
            // `quantity` ya no es lo que se encargó.
            quantity: service.requestedQuantity,
            measurementUnit: service.measurementUnit,
            price: service.price,
            // Sin declarar: el Plan Maestro no devuelve price_includes_tax, asi
            // que la Orden de Servicio impresa desde Avances sale sin desglose.
            // Se arregla exponiendolo en sp_get_production_plan.
            includesTax: null,
          },
        ],
        garments: service.items.map((item) => ({
          label: item.name,
          sku: item.sku,
          // El servicio sabe qué prendas cubre, pero no cuántas de cada una:
          // ese reparto es del avance, no del encargo. La rejilla marca la
          // talla en vez de poner un número.
          quantity: null,
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
      setImprimiendo(false);
    }
  };

  const pedido = celda?.requested ?? service.requestedQuantity;
  const recibido = celda?.good ?? service.quantity;
  const merma = celda?.bad ?? service.badQuantity;
  const faltante = celda?.remaining ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{processName}</DialogTitle>
          <DialogDescription>
            {itemLabel}
            {service.supplierName ? ` · ${service.supplierName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando el detalle...
          </div>
        ) : (
          <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Dato label="Se pidió">{num(pedido)}</Dato>
              <Dato label="Se recibió">{num(recibido)}</Dato>
              <Dato label="Merma">{num(merma)}</Dato>
              <Dato label="Faltante">{num(faltante)}</Dato>
              <Dato label="Empezó">
                {primero ? formatDateTime(primero.created_at) : "—"}
              </Dato>
              <Dato label="Terminó">
                {celda?.isComplete && ultimo
                  ? formatDateTime(ultimo.created_at)
                  : "—"}
              </Dato>
              <Dato label="Situación">
                <Badge variant="secondary">{service.situationName || "—"}</Badge>
              </Dato>
              <Dato label="Precio del servicio">
                {service.price === null ? "—" : formatCurrency(service.price)}
              </Dato>
            </div>

            {/* De dónde viene y a dónde va.

                La guía se emite hacia el taller DESTINO, así que la que
                recibió este proceso es la de SU propio servicio y la de la
                pierna siguiente es la del servicio que viene después. El
                número se deriva del id del servicio, así que se puede nombrar
                la guía del paso siguiente antes de haberla impreso. */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Trazabilidad</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {/* Con qué llegó aquí. Es la guía de ESTE servicio: se emitió
                    para mandarle la mercadería a este taller. */}
                <Tramo
                  rotulo="Recibido con"
                  icono={<PackageCheck className="h-3.5 w-3.5" />}
                  service={service}
                  desde={previous?.processName ?? "Almacén"}
                  hasta={processName}
                  cantidad={pedido}
                  itemId={productionOrderItemId}
                  contexto={{
                    orderCode: productionOrderCode,
                    processName,
                    // De dónde salió para llegar aquí: el taller anterior, o
                    // el almacén si este es el primer proceso.
                    origin: previous
                      ? {
                          processName: previous.processName,
                          supplierName: previous.service.supplierName,
                          address: previous.service.supplierAddress,
                        }
                      : null,
                    sentAt: primero?.created_at ?? null,
                  }}
                  vacio="Sin guía: este paso no tiene servicio asignado."
                  accion="Reimprimir guía"
                />
                {/* Y con cuál sigue. Va la cantidad que salió BUENA de este
                    proceso, que es exactamente lo que se manda al siguiente. */}
                <Tramo
                  rotulo="Se envía con"
                  icono={<ArrowRight className="h-3.5 w-3.5" />}
                  service={next?.service ?? null}
                  desde={processName}
                  hasta={next?.processName}
                  cantidad={recibido}
                  itemId={productionOrderItemId}
                  contexto={{
                    orderCode: productionOrderCode,
                    processName: next?.processName ?? null,
                    // Ahora el que despacha es ESTE taller: la prenda sale de
                    // aquí hacia el siguiente proceso.
                    origin: {
                      processName,
                      supplierName: service.supplierName,
                      address: service.supplierAddress,
                    },
                    // Se manda cuando este proceso terminó, no cuando se
                    // imprime el papel: la guía se reimprime y la fecha del
                    // envío no cambia por eso.
                    sentAt: ultimo?.created_at ?? null,
                  }}
                  vacio="Es el último proceso: lo que salga vuelve a almacén con su guía de ingreso."
                  accion="Imprimir guía de salida"
                  destacado
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Movimientos</h3>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Todavía no hay movimientos registrados.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {history.map((movimiento, index) => (
                    <li
                      key={`${movimiento.created_at}-${index}`}
                      className="space-y-1 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {movimiento.situation_name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {num(movimiento.quantity)} buenas ·{" "}
                          {num(movimiento.bad_quantity)} merma ·{" "}
                          {formatDateTime(movimiento.created_at)} ·{" "}
                          {movimiento.created_by_name}
                        </span>
                      </div>

                      {/* La nota del avance, en su propia línea y entera.
                      
                          Es donde se explica por qué faltan prendas, así que
                          es lo que se viene a leer cuando las cifras no
                          cuadran. Pegada al final de la línea de arriba se
                          perdía entre las cantidades, y con un nombre largo
                          de usuario ni se veía. */}
                      {movimiento.message && (
                        <p className="text-muted-foreground text-xs italic">
                          {movimiento.message}
                        </p>
                      )}
                    </li>
                  ))}

                </ul>
              )}
            </div>
          </div>
        )}

        {/* El papel del taller y el pago.

            No está el botón de «Guía de remisión» que había aquí: imprimía
            exactamente la misma guía que ahora sale en «Recibido con», y arriba
            dice además cuál es y de dónde viene. Dos botones para el mismo PDF
            solo servían para dudar de si eran el mismo papel. */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={imprimiendo}
            onClick={handlePrintServiceOrder}
          >
            {imprimiendo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Orden de servicio
          </Button>

          {onPay && (
            <Button type="button" className="gap-2" onClick={() => onPay(service)}>
              <Wallet className="h-4 w-4" />
              Pagos del servicio
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessDetailDialog;
