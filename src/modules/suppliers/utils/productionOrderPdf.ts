import type { PrintData } from "@/modules/print-templates/editor/lib/print-data";
import type { PrintDataRow } from "@/modules/print-templates/constants/printDataSources";
import { printDocument } from "@/modules/print-templates/print/printDocument";
import { formatDateDisplay } from "@/shared/utils/date";
import {
  ProductionOrderPdfData,
  ProductionOrderPdfGarment,
  buildProductionOrderDocument,
  lista,
  qty,
} from "./productionOrderDocument/build";

export type {
  ProductionOrderPdfData,
  ProductionOrderPdfGarment,
  ProductionOrderPdfMaterial,
} from "./productionOrderDocument/build";

/**
 * Orden de Producción: el papel que abre la producción de un lote.
 *
 * Junta las dos caras de la orden: **qué se produce** —las prendas con su talla
 * y su cantidad— y **por dónde pasa** —la ruta de producción—. Los materiales
 * van en su propio papel, el Requerimiento de Materiales.
 *
 * Se imprime con su plantilla (print-templates, code `production_order`): la
 * personalizada en uso o la del sistema. Los datos salen con el mismo formato que el PDF
 * de antes (`productionOrderDocument/build`), que queda sin uso.
 */

/** Cuántas fotos van como mucho: en el papel solo entra una fila. */
const MAX_IMAGENES = 6;

/** La marca de «esta talla va, pero no se sabe cuántas» (como garmentGrid). */
const MARCA = "•";

/** «Polo Básico - Negro»: producto y color, sin la talla, que va en «Tallas». */
const garmentName = (garment: ProductionOrderPdfGarment): string =>
  [garment.productTitle, garment.otherTerms].filter(Boolean).join(" - ") ||
  garment.label;

/** El estado de un paso de la ruta, como lo escribía el papel de antes. */
const estadoPaso = (paso: NonNullable<ProductionOrderPdfData["processes"]>[number]) =>
  paso.isComplete
    ? "Terminado"
    : paso.isBlocked
      ? "Bloqueado"
      : paso.advanced > 0
        ? "En proceso"
        : "Pendiente";

/**
 * Las prendas en filas para la fuente production_order_garments: una por
 * producto y color, con sus tallas ya escritas («S 100 · M 200 · L 100») y su
 * total. Es la rejilla de antes (garmentSections) puesta en una línea:
 *
 * - Las tallas van en el orden del catálogo (`sizeTermId`), y la misma talla
 *   dos veces en la misma fila se suma.
 * - Las filas, en orden de aparición, juntas por sistema de tallas, como las
 *   tablas de antes.
 * - Lo que no tiene talla va al final, una fila por prenda con su SKU
 *   delante («[SKU] Prenda»), como la lista de antes.
 * - Sin cantidad (`null`), la talla lleva «•» y la fila no lleva total: un
 *   cero se leería como «ninguna».
 */
export const productionOrderGarmentRows = (
  garments: ProductionOrderPdfGarment[],
): PrintDataRow[] => {
  interface Fila {
    garment: string;
    /** Talla → id del término (para ordenar) y la suma, o null sin cantidad. */
    tallas: Map<string, { id: number; quantity: number | null }>;
  }
  const grupos = new Map<string, Map<string, Fila>>();
  const sinTalla: PrintDataRow[] = [];

  for (const garment of garments) {
    if (garment.sizeTerm === null || garment.sizeGroup === null) {
      const nombre = garmentName(garment);
      sinTalla.push({
        garment: garment.sku ? `[${garment.sku}] ${nombre}` : nombre,
        sizes: null,
        total: garment.quantity === null ? MARCA : qty(garment.quantity),
      });
      continue;
    }

    const filas = grupos.get(garment.sizeGroup) ?? new Map<string, Fila>();
    grupos.set(garment.sizeGroup, filas);
    const nombre = garmentName(garment);
    const fila = filas.get(nombre) ?? { garment: nombre, tallas: new Map() };
    filas.set(nombre, fila);

    const previa = fila.tallas.get(garment.sizeTerm);
    fila.tallas.set(garment.sizeTerm, {
      // Sin id se manda al final; no debería pasar si la talla vino con nombre.
      id: garment.sizeTermId ?? Number.MAX_SAFE_INTEGER,
      quantity: !previa
        ? garment.quantity
        : previa.quantity === null || garment.quantity === null
          ? null
          : previa.quantity + garment.quantity,
    });
  }

  const conTalla = [...grupos.values()].flatMap((filas) =>
    [...filas.values()].map((fila): PrintDataRow => {
      const tallas = [...fila.tallas.entries()].sort((a, b) => a[1].id - b[1].id);
      const conCantidades = tallas.every(([, talla]) => talla.quantity !== null);
      return {
        garment: fila.garment,
        sizes: tallas
          .map(([talla, { quantity }]) =>
            `${talla} ${quantity === null ? MARCA : qty(quantity)}`,
          )
          .join(" · "),
        total: conCantidades
          ? qty(tallas.reduce((sum, [, talla]) => sum + (talla.quantity ?? 0), 0))
          : null,
      };
    }),
  );

  return [...conTalla, ...sinTalla];
};

/**
 * Los datos de la Orden de Producción para su plantilla: la ruta y los datos
 * sueltos (production_order), las prendas (production_order_garments) y las
 * fotos (production_order_images, las urls de Storage tal cual).
 */
export const productionOrderPrintData = (
  data: ProductionOrderPdfData & { imageUrls?: string[] },
): PrintData => {
  const totalGarments = data.garments.reduce(
    (sum, garment) => sum + (garment.quantity ?? 0),
    0,
  );

  return {
    production_order: {
      rows: (data.processes ?? []).map((paso) => ({
        step: String(paso.order),
        process: paso.processName ?? "Sin proceso",
        group: paso.processGroupName ?? null,
        services: paso.serviceCodes.length > 0 ? paso.serviceCodes.join(", ") : null,
        requested: qty(paso.requested),
        finished: qty(paso.advanced),
        // En cero va el guion: lo que tiene que saltar a la vista es lo que
        // queda por hacer.
        missing: paso.remaining > 0 ? qty(paso.remaining) : null,
        status: estadoPaso(paso),
      })),
      values: {
        orderCode: data.code ?? `#${data.orderId}`,
        name: data.name || null,
        className: data.className || null,
        status: data.statusLabel || null,
        // Este ERP no tiene fecha de emisión en la orden: va la de registro,
        // la que imprimía el papel de antes.
        issueDate: formatDateDisplay(data.createdAt),
        promisedDate: data.promisedDate ? formatDateDisplay(data.promisedDate) : null,
        garmentsTotal: totalGarments > 0 ? qty(totalGarments) : null,
        categories: lista(data.categories),
        tags: lista(data.tags),
        observations: data.description?.trim() || null,
      },
    },
    production_order_garments: { rows: productionOrderGarmentRows(data.garments) },
    production_order_images: {
      rows: (data.imageUrls ?? []).slice(0, MAX_IMAGENES).map((url) => ({ photo: url })),
    },
  };
};

/** Imprime la Orden de Producción con su plantilla (la personalizada en uso o la del sistema). */
export const openProductionOrderPdf = async (
  data: Parameters<typeof buildProductionOrderDocument>[0] & {
    /** Urls de las fotos de las prendas, en orden. */
    imageUrls?: string[];
  },
): Promise<void> => {
  const orderLabel = data.code ?? `#${data.orderId}`;
  await printDocument("production_order", productionOrderPrintData(data), {
    fileName: `Orden de Producción ${orderLabel}`,
  });
};
