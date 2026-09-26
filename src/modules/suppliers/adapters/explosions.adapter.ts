import {
  Explosion,
  ExplosionDetail,
  ExplosionMaterial,
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
  description: row.description ?? "",
  modelCode: toTextOrNull(row.model_code),
  total: Number(row.total ?? 0),
  // materials_count sigue llegando del SP y ya no se mapea: la columna se
  // retiro de la tabla --cuantos materiales lleva una receta no es una
  // pregunta que se haga desde el listado-- y dejarlo aqui era arrastrar un
  // campo que nadie lee.
  createdAt: row.created_at ?? "",
  ...toExplosionVariations(row),
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
  description: row.description ?? "",
  modelCode: toTextOrNull(row.model_code),
  total: Number(row.total ?? 0),
  createdAt: row.created_at ?? "",
  materials: (row.materials ?? []).map(toExplosionMaterial),
  ...toExplosionVariations(row),
});
