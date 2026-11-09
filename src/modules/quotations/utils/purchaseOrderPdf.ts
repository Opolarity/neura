import { formatDateDisplay } from "@/shared/utils/date";
import { taxBreakdownOf, taxLabel } from "@/shared/utils/tax";
import { currencySymbol, formatDocumentMoney } from "@/shared/utils/currency";
import type { PrintData } from "@/modules/print-templates/editor/lib/print-data";
import { printDocument } from "@/modules/print-templates/print/printDocument";
import { notesToObservations } from "./quotationNotes";
import {
  buildPurchaseOrderDocument,
  qty,
  unitPrice,
} from "./purchaseOrderDocument/build";

export type {
  PurchaseOrderData,
  PurchaseOrderLine,
} from "./purchaseOrderDocument/build";

type PurchaseOrderInput = Parameters<typeof buildPurchaseOrderDocument>[0];

/** Un dato vacío no llega: la plantilla oculta su rótulo, como el papel de antes. */
const conValor = (value: string | null | undefined) =>
  value && value.trim() !== "" ? value : null;

/**
 * Los datos de la Orden de Compra para su plantilla (fuente purchase_order de
 * print-templates), con los mismos textos y formatos que armaba
 * `buildPurchaseOrderDocument`.
 */
export const purchaseOrderPrintData = (data: PurchaseOrderInput): PrintData => {
  // Todos los importes del papel, en la moneda de la cotización.
  const money = (value: number | null | undefined) =>
    formatDocumentMoney(value, data.currency);

  const total = data.lines.reduce((sum, line) => sum + (line.price ?? 0), 0);
  // Subtotal e IGV solo si alguna línea declara el IGV; si no, solo el total.
  const desglose = taxBreakdownOf(data.lines);

  // Las cantidades solo se suman si todas las líneas van en la misma unidad.
  const unidades = [...new Set(data.lines.map((line) => line.measurementUnit))];
  const cantidadTotal =
    unidades.length === 1 && unidades[0]
      ? `${qty(data.lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0))} ${unidades[0]}`
      : null;

  // Lo pactado sobre el pago, delante de las notas del pedido.
  const observaciones = [
    ...notesToObservations(data.paymentTerms),
    ...notesToObservations(data.quotationNotes),
  ];

  return {
    purchase_order: {
      rows: data.lines.map((line) => ({
        quantity: qty(line.quantity),
        unit: line.measurementUnit ?? "—",
        code: line.code,
        description: line.description,
        unitPrice: money(unitPrice(line)),
        total: money(line.price),
        tax: taxLabel(line.includesTax),
      })),
      values: {
        orderCode: conValor(data.quotationCode),
        supplierName: conValor(data.supplierName),
        issueDate: formatDateDisplay(data.createdAt),
        deliveryDate: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
        supplierDocument: conValor(data.supplierDocument),
        supplierPhone: conValor(data.supplierPhone),
        request: conValor(data.quotationDescription),
        distinctMaterials: data.lines.length > 0 ? String(data.lines.length) : null,
        totalQuantity: cantidadTotal,
        currency: `${data.currency ?? "PEN"} · ${currencySymbol(data.currency)}`,
        subtotal: desglose ? money(desglose.base) : null,
        igv: desglose ? money(desglose.igv) : null,
        total: money(desglose ? desglose.total : total),
        observations: observaciones.length > 0 ? observaciones.join("\n") : null,
      },
    },
  };
};

/**
 * Orden de Compra: el papel del material que se le pide al proveedor.
 *
 * Se imprime con su plantilla (la personalizada en uso o la del sistema). Los datos de
 * la empresa salen de la sesión, así que `data.company` ya no se usa aquí; el
 * builder viejo (`purchaseOrderDocument/build`) queda como referencia.
 */
export const openPurchaseOrderPdf = (data: PurchaseOrderInput): void => {
  void printDocument("purchase_order", purchaseOrderPrintData(data), {
    fileName: `Orden de Compra ${data.quotationCode ?? ""}`.trim(),
  });
};
