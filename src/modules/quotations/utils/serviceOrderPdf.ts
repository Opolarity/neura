import { openSheetPdf } from "@/shared/utils/sheetDocument";
import { buildServiceOrderDocument } from "./serviceOrderDocument/build";

export type {
  ServiceOrderData,
  ServiceOrderGarment,
  ServiceOrderLine,
} from "./serviceOrderDocument/build";

/**
 * Orden de Servicio: el papel que se le entrega al taller.
 *
 * Esto es solo la puerta. Los datos los arma `serviceOrderDocument/build` --que
 * es donde está escrito por qué desde Avances sale un servicio y desde
 * Cotizaciones la cotización entera-- y el dibujo lo pone
 * `shared/utils/sheetDocument`, el mismo motor de la Orden de Producción.
 */
export const openServiceOrderPdf = (
  data: Parameters<typeof buildServiceOrderDocument>[0],
): void => {
  const documento = buildServiceOrderDocument(data);
  const numero = data.serviceCode ?? data.quotationCode ?? "";
  openSheetPdf(documento, `Orden de Servicio ${numero}`.trim());
};
