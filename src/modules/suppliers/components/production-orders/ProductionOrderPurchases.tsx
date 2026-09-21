import { useState } from "react";
import { FileText, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastError } from "@/shared/utils/toastError";
import { formatDateDisplay } from "@/shared/utils/date";
import {
  allQuotationServicesApi,
  purchaseOrderHeaderApi,
} from "@/modules/quotations/services/Quotations.service";
import { openPurchaseOrderPdf } from "@/modules/quotations/utils/purchaseOrderPdf";
import { useProductionOrderPurchases } from "../../hooks/useProductionOrderPurchases";
import { ProductionOrderPurchase } from "../../types/productionOrderPurchases.types";
import { PurchaseSituationDialog } from "./PurchaseSituationDialog";

interface ProductionOrderPurchasesProps {
  productionOrderId: number;
  /** Sube al comprar: la compra recién hecha tiene que aparecer sola. */
  reloadKey?: number;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);

/**
 * Las compras de material que cuelgan de la orden, con su papel.
 *
 * Hasta ahora se compraba desde la explosión y ahí se perdía el rastro: la
 * orden no enseñaba sus compras en ningún sitio, aunque el vínculo existía.
 *
 * **Una fila es un proveedor**, no un material: una cotización tiene un solo
 * `supplier_id`, así que comprar el mismo requerimiento a dos proveedores son
 * dos compras y dos órdenes de compra distintas.
 *
 * Las líneas del papel NO se toman de esta tabla: se piden completas al
 * imprimir. Aquí solo hay el resumen, y una orden de compra que imprimiera un
 * resumen sería un documento que se contradice con la cotización.
 */
export const ProductionOrderPurchases = ({
  productionOrderId,
  reloadKey = 0,
}: ProductionOrderPurchasesProps) => {
  const { purchases, loading } = useProductionOrderPurchases(
    productionOrderId,
    reloadKey,
  );

  /** Qué cotización se está imprimiendo: el spinner es de su fila, no global. */
  const [imprimiendo, setImprimiendo] = useState<number | null>(null);

  /**
   * La compra cuya situación se está cambiando.
   *
   * Se edita desde aquí y no desde Cotizaciones: la compra vive en esta orden,
   * y salir a buscarla en otra pantalla para marcarla recibida era el paseo que
   * este botón evita.
   */
  const [cambiando, setCambiando] = useState<ProductionOrderPurchase | null>(null);

  const handlePrint = async (purchase: ProductionOrderPurchase) => {
    try {
      setImprimiendo(purchase.quotationId);

      const [header, lines] = await Promise.all([
        purchaseOrderHeaderApi(purchase.supplierId),
        allQuotationServicesApi(purchase.quotationId, "MATERIAL"),
      ]);

      // La entrega de la compra es la MAS LEJANA de las comprometidas: es
      // cuando se espera tenerlo todo. Mismo criterio que la Orden de Servicio.
      const promisedDates = lines
        .map((line) => line.promised_date)
        .filter((date): date is string => !!date)
        .sort();

      openPurchaseOrderPdf({
        quotationCode: purchase.quotationCode,
        quotationDescription: purchase.quotationDescription,
        quotationNotes: purchase.quotationNotes,
        currency: purchase.currency,
        paymentTerms: purchase.paymentTerms,
        createdAt: purchase.createdAt,
        promisedDate: promisedDates[promisedDates.length - 1] ?? null,
        supplierName: purchase.supplierName,
        supplierDocument: header.supplierDocument,
        supplierPhone: header.supplierPhone,
        company: header.company,
        lines: lines.map((service) => ({
          code: service.code,
          description: service.description,
          quantity: service.last_situation?.quantity ?? null,
          measurementUnit: service.last_situation?.measurement_unit ?? null,
          price: service.last_situation?.price ?? null,
          includesTax: service.price_includes_tax ?? null,
        })),
      });
    } catch (error) {
      toastError(error, "No se pudo generar la orden de compra");
    } finally {
      setImprimiendo(null);
    }
  };

  // Sin compras no se pinta nada: un bloque vacío en una pantalla que ya es
  // larga solo ocupa sitio. El botón de comprar está justo arriba.
  if (loading || purchases.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold">Compras de esta orden</h3>
        <p className="text-muted-foreground text-xs">
          Una por proveedor. Cada una se imprime como orden de compra.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cotización</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-right">Líneas</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.quotationId}>
                <TableCell className="font-medium">
                  {purchase.quotationCode ?? `#${purchase.quotationId}`}
                </TableCell>
                <TableCell>{purchase.supplierName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {purchase.lines}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(purchase.total)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateDisplay(purchase.createdAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setCambiando(purchase)}
                    title="Cambiar la situación de sus líneas sin salir de la orden"
                  >
                    <Package className="h-4 w-4" />
                    Situación
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    disabled={imprimiendo !== null}
                    onClick={() => handlePrint(purchase)}
                    title="Imprimir la orden de compra de este proveedor"
                  >
                    {imprimiendo === purchase.quotationId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Orden de compra
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {cambiando && (
        <PurchaseSituationDialog
          open
          onOpenChange={(abierto) => {
            if (!abierto) setCambiando(null);
          }}
          quotationId={cambiando.quotationId}
          quotationLabel={cambiando.quotationCode ?? `#${cambiando.quotationId}`}
          supplierName={cambiando.supplierName}
        />
      )}
    </div>
  );
};
