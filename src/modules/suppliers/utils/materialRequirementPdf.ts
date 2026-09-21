import { openSheetPdf } from "@/shared/utils/sheetDocument";
import { buildMaterialRequirementDocument } from "./materialRequirementDocument/build";

export type {
  MaterialRequirementPdfData,
  MaterialRequirementPdfRow,
} from "./materialRequirementDocument/build";

/**
 * El requerimiento de materiales de una orden de producción.
 *
 * Es el papel con el que se sale a comprar, así que lo que manda es la columna
 * **Faltante**: lo que la orden necesita menos lo que hay en almacén. Va
 * separado de la Orden de Producción —que lleva las prendas, la ruta y este
 * requerimiento resumido— porque a comprar se va con una hoja de materiales,
 * no con la orden entera.
 *
 * No vive en la receta, y no es un descuido: la receta dice lo que consume UNA
 * prenda. El requerimiento solo existe cuando hay una orden que diga cuántas
 * prendas son, y por eso encabeza con su código.
 *
 * Esto es solo la puerta. Los datos los arma `materialRequirementDocument/build`
 * y el dibujo lo pone `shared/utils/sheetDocument`, que es el formato que este
 * papel comparte con la Orden de Producción.
 */
export const openMaterialRequirementPdf = (
  data: Parameters<typeof buildMaterialRequirementDocument>[0],
): void => {
  const documento = buildMaterialRequirementDocument(data);
  const orderLabel = data.orderCode ?? `#${data.orderId}`;
  openSheetPdf(documento, `Requerimiento de Materiales ${orderLabel}`);
};
