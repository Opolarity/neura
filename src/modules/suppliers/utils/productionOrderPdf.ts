import { SheetImage, openSheetPdf } from "@/shared/utils/sheetDocument";
import { buildProductionOrderDocument } from "./productionOrderDocument/build";

export type {
  ProductionOrderPdfData,
  ProductionOrderPdfGarment,
  ProductionOrderPdfMaterial,
} from "./productionOrderDocument/build";

/**
 * Orden de Producción: el papel que abre la producción de un lote.
 *
 * Junta las dos caras de la orden: **qué se produce** —las prendas con su talla
 * y su cantidad— y **qué lleva** —los materiales de la explosión, sumados para
 * todo el lote y agrupados por clase—.
 *
 * Comparte formato con el Requerimiento de Materiales: mismo motor, misma
 * cabecera, mismas secciones. Los dos salen del mismo lote y se leen juntos en
 * el taller, así que tienen que verse iguales.
 *
 * Esto es solo la puerta: los datos los arma `productionOrderDocument/build` y
 * el dibujo lo pone `shared/utils/sheetDocument`.
 */

/** Cuántas fotos se bajan como mucho: en el papel solo entra una fila. */
const MAX_IMAGENES = 6;

/**
 * Baja las fotos y las convierte a base64, que es lo único que jsPDF sabe
 * dibujar.
 *
 * Se bajan en paralelo y **una que falle no rompe nada**: se descarta y el
 * papel sale con las demás, o sin ninguna. Una Orden de Producción que no se
 * puede imprimir porque una foto dio 404 sería un intercambio pésimo.
 */
const embedImages = async (urls: string[]): Promise<SheetImage[]> => {
  const resultados = await Promise.all(
    urls.slice(0, MAX_IMAGENES).map(async (url): Promise<SheetImage | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        return { dataUrl };
      } catch {
        return null;
      }
    }),
  );

  return resultados.filter((image): image is SheetImage => image !== null);
};
export const openProductionOrderPdf = async (
  data: Parameters<typeof buildProductionOrderDocument>[0] & {
    /** Urls de las fotos de las prendas, en orden. */
    imageUrls?: string[];
  },
): Promise<void> => {
  const images = await embedImages(data.imageUrls ?? []);
  const documento = buildProductionOrderDocument({ ...data, images });
  const orderLabel = data.code ?? `#${data.orderId}`;
  openSheetPdf(documento, `Orden de Produccion ${orderLabel}`);
};
