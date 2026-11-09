import type { PrintData } from "@/modules/print-templates/editor/lib/print-data";
import { printDocument } from "@/modules/print-templates/print/printDocument";
import { formatDateDisplay } from "@/shared/utils/date";
import {
  RecipePdfData,
  RecipePdfMaterial,
  SIN_CLASE,
  buildRecipeDocument,
  money,
  porPrenda,
  qty,
  sinClaseAlFinal,
  unitMoney,
} from "./recipeDocument/build";

export type {
  RecipePdfData,
  RecipePdfMaterial,
} from "./recipeDocument/build";

/**
 * La receta de una prenda, impresa: qué lleva una prenda y cuánto cuesta.
 *
 * Se imprime con su plantilla (print-templates, code `recipe`): la personalizada en uso
 * o la del sistema. Los datos salen con el mismo formato que el PDF de antes
 * (`recipeDocument/build`), que queda sin uso.
 */

/** La nota que explica la columna «Por prenda»; solo va si la columna sale. */
const NOTA_POR_PRENDA =
  "Por prenda: las prendas listadas llevan esa cantidad en lugar del consumo general. Las que no aparecen usan el consumo general.";

/**
 * Los datos de la receta para su plantilla (fuente recipe): un material por
 * fila, juntos por clase en el orden en que se armó la receta («SIN CLASE» al
 * final), con el subtotal de su clase en cada fila (el pie del grupo), y los
 * datos sueltos de la cabecera.
 */
export const recipePrintData = (data: RecipePdfData): PrintData => {
  // «Por prenda» solo cuenta las excepciones que LO LLEVAN, que son las que se
  // imprimen: sin ninguna, la columna llega vacía y no se dibuja.
  const hayExcepciones = data.materials.some((material) =>
    (material.variations ?? []).some((variation) => variation.quantity > 0),
  );

  const porClase = new Map<string, RecipePdfMaterial[]>();
  data.materials.forEach((material) => {
    const clave = material.className ?? SIN_CLASE;
    porClase.set(clave, [...(porClase.get(clave) ?? []), material]);
  });
  const clases = [...porClase.keys()].sort(sinClaseAlFinal);

  const rows = clases.flatMap((clase) => {
    const grupo = porClase.get(clase) ?? [];
    const subtotal = money(grupo.reduce((sum, m) => sum + m.lineTotal, 0));
    return grupo.map((material) => ({
      materialClass: clase,
      classSubtotal: subtotal,
      consumption: qty(material.unitConsumption),
      unit: material.measurementUnit ?? null,
      material: material.name,
      perGarment: hayExcepciones ? porPrenda(material.variations ?? []) || null : null,
      unitCost: unitMoney(material.unitCost),
      amount: money(material.lineTotal),
    }));
  });

  return {
    recipe: {
      rows,
      values: {
        recipe: data.description || `#${data.explosionId}`,
        modelCode: data.modelCode || null,
        garment: data.variationLabel || null,
        registeredAt: data.createdAt ? formatDateDisplay(data.createdAt) : null,
        distinctMaterials:
          data.materials.length > 0 ? String(data.materials.length) : null,
        types: clases.length > 0 ? clases.join(", ") : null,
        total: money(data.total),
        footnote: hayExcepciones ? NOTA_POR_PRENDA : null,
      },
    },
  };
};

/** Imprime la receta con su plantilla (la personalizada en uso o la del sistema). */
export const openRecipePdf = (data: Parameters<typeof buildRecipeDocument>[0]): void => {
  void printDocument("recipe", recipePrintData(data), {
    fileName: `Receta ${data.description || `#${data.explosionId}`}`.trim(),
  });
};
