import {
  Explosion,
  ExplosionDetail,
  ExplosionMaterial,
  ExplosionProcess,
  ExplosionVariations,
} from "../types/explosions.types";

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
};

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

/** La parte de prendas, que el listado y el detalle comparten. */
const toExplosionVariations = (row: any): ExplosionVariations => ({
  variations: (row.variations ?? []).map((v: any) => ({
    variationId: v.variation_id,
    variationSku: toTextOrNull(v.variation_sku),
    productId: toNumberOrNull(v.product_id),
    productTitle: toTextOrNull(v.product_title),
    variationLabel: toTextOrNull(v.variation_label),
  })),
  categories: (row.categories ?? []).map((c: any) => ({
    id: c.id,
    name: c.name ?? "",
  })),
});

/** Fila de sp_get_explosions → modelo de UI. */
export const toExplosion = (row: any): Explosion => ({
  id: row.id,
  productId: toNumberOrNull(row.product_id),
  productTitle: toTextOrNull(row.product_title),
  description: row.description ?? "",
  modelCode: toTextOrNull(row.model_code),
  total: Number(row.total ?? 0),
  // materials_count sigue llegando del SP y ya no se mapea: la columna se
  // retiro de la tabla --cuantos materiales lleva una receta no es una
  // pregunta que se haga desde el listado-- y dejarlo aqui era arrastrar un
  // campo que nadie lee.
  processesCount: Number(row.processes_count ?? 0),
  createdAt: row.created_at ?? "",
  ...toExplosionVariations(row),
});

/**
 * Etapa de la ruta → modelo de UI. Llega ya ordenada por el SP, y con sus
 * operaciones dentro: en la tabla cada operación es una fila, pero el SP las
 * agrupa por etapa porque todas comparten su posición.
 */
export const toExplosionProcess = (row: any): ExplosionProcess => ({
  processGroupId: Number(row.process_group_id),
  processGroupName: toTextOrNull(row.process_group_name),
  operations: (row.operations ?? []).map((operacion: any) => ({
    processId: Number(operacion.process_id),
    processName: toTextOrNull(operacion.process_name),
  })),
});

export const toExplosionMaterial = (row: any): ExplosionMaterial => ({
  id: row.id,
  materialId: row.material_id,
  materialVariationId: toNumberOrNull(row.material_variation_id),
  materialName: row.material_name ?? "",
  materialClassId: toNumberOrNull(row.material_class_id),
  materialClassName: toTextOrNull(row.material_class_name),
  measurementUnit: toTextOrNull(row.measurement_unit),
  unitCost: toNumberOrNull(row.unit_cost),
  quantity: toNumberOrNull(row.quantity),
  lineTotal: Number(row.line_total ?? 0),
  variations: (row.variations ?? []).map((v: { variation_id: number; quantity: number }) => ({
    variationId: Number(v.variation_id),
    quantity: Number(v.quantity),
  })),
});

/** Respuesta de sp_get_explosion_by_id → detalle de UI. */
export const toExplosionDetail = (row: any): ExplosionDetail => ({
  id: row.id,
  product: row.product
    ? {
        id: Number(row.product.id),
        title: row.product.title ?? "",
        code: toTextOrNull(row.product.code),
      }
    : null,
  unify: row.unify?.product_id
    ? {
        productId: Number(row.unify.product_id),
        productTitle: toTextOrNull(row.unify.product_title),
        hasRecipe: Boolean(row.unify.has_recipe),
        competitors: (row.unify.competitors ?? []).map(Number),
      }
    : null,
  description: row.description ?? "",
  modelCode: toTextOrNull(row.model_code),
  total: Number(row.total ?? 0),
  createdAt: row.created_at ?? "",
  materials: (row.materials ?? []).map(toExplosionMaterial),
  processes: (row.processes ?? []).map(toExplosionProcess),
  ...toExplosionVariations(row),
});
