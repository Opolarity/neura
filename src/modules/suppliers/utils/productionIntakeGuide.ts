import { openRemisionGuidePdf } from "@/shared/utils/remisionGuidePdf";
import { getCompanyDocumentHeader } from "@/shared/services/companyHeader";

/**
 * Serie de las guías de ingreso.
 *
 * Distinta de la `T001` de ventas, la `P001` de producción y la `M001` de
 * traslados a propósito: el correlativo de todas es un id de la base, así que
 * compartir serie haría que dos documentos distintos salieran con el mismo
 * número. Aquí el correlativo es la entrada de stock.
 */
const SERIE = "I001";

/** Una prenda que entra, tal como la tiene el diálogo de recepción. */
export interface IntakeGuideLine {
  sku: string;
  /** Producto y variación ya unidos. */
  productName: string;
  quantity: number;
}

export interface IntakeGuideData {
  /** El id de la entrada de stock: es el correlativo de la guía. */
  stockEntryId: number;
  /** Cómo se llama la orden: OP-0001, o su nombre. */
  orderLabel: string;
  /** A dónde entra. */
  warehouseName: string;
  warehouseAddress?: string | null;
  lines: IntakeGuideLine[];
}

/**
 * La guía de ingreso de lo que entra a almacén desde una orden de producción.
 *
 * Gemela de la guía de remisión —mismo papel, otro título—: aquella es de lo
 * que sale hacia el taller; esta, de lo que vuelve terminado y entra a stock.
 * El destinatario es la propia empresa —la mercadería entra a un almacén
 * suyo—, con su RUC, y el destino es el almacén elegido al recibir.
 */
export async function openProductionIntakeGuide(
  data: IntakeGuideData,
): Promise<void> {
  const lineas = data.lines.filter((line) => line.quantity > 0);
  if (lineas.length === 0) return;

  const empresa = await getCompanyDocumentHeader();

  await openRemisionGuidePdf({
    title: "GUÍA DE INGRESO",
    guideNumber: `${SERIE}-${String(data.stockEntryId).padStart(8, "0")}`,
    recipientName: empresa.name,
    documentType: "RUC",
    documentNumber: empresa.documentNumber ?? "",
    destinationAddress: [data.warehouseName, data.warehouseAddress]
      .filter(Boolean)
      .join(" · "),
    transferReason: `Ingreso a almacén · orden de producción ${data.orderLabel}`,
    items: lineas.map((line) => ({
      sku: line.sku,
      // El nombre ya viene compuesto como producto y variación; la guía lo
      // parte en producto y variación otra vez, así que se le da entero como
      // producto y la variación vacía.
      productName: line.productName,
      variationName: "",
      quantity: line.quantity,
    })),
  });
}
