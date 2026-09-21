import { openSheetPdf } from "@/shared/utils/sheetDocument";
import { buildPurchaseOrderDocument } from "./purchaseOrderDocument/build";

export type {
  PurchaseOrderData,
  PurchaseOrderLine,
} from "./purchaseOrderDocument/build";

/**
 * Orden de Compra: el papel del material que se le pide al proveedor.
 *
 * Esto es solo la puerta. Los datos los arma `purchaseOrderDocument/build` y el
 * dibujo lo pone `shared/utils/sheetDocument`, el mismo motor de la Orden de
 * Producción. Esa frontera es lo que permite cambiar el papel sin tocar la
 * consulta, y al revés.
 */
export const openPurchaseOrderPdf = (
  data: Parameters<typeof buildPurchaseOrderDocument>[0],
): void => {
  const documento = buildPurchaseOrderDocument(data);
  openSheetPdf(documento, `Orden de Compra ${data.quotationCode ?? ""}`.trim());
};
