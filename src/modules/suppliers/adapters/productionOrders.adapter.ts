import { toLinkedService } from "./productionOrderServices.adapter";
import { explosionShortLabel } from "../utils/explosionLabel";
import { toItemSizeParts } from "../utils/productionItemDisplay";
import {
  ExplosionOption,
  ProductionOrder,
  ProductionOrderDetail,
  ProductionOrderItem,
} from "../types/productionOrders.types";

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
};

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

/** Fila de sp_get_production_orders → modelo de UI. */
export const toProductionOrder = (row: any): ProductionOrder => ({
  id: row.id,
  name: row.name ?? "",
  code: toTextOrNull(row.code),
  description: toTextOrNull(row.description),
  quantity: toNumberOrNull(row.quantity),
  productionOrderClassId: row.production_order_class_id,
  productionOrderClassName: row.production_order_class_name ?? "",
  itemsCount: Number(row.items_count ?? 0),
  status: row.status ?? "DRAFT",
  type: row.type ?? null,
  createdAt: row.created_at ?? "",
});

/** «Chompa Overtake Fire - M». Null si el ítem no tiene producto asignado. */
const buildVariationLabel = (row: any): string | null => {
  const title = toTextOrNull(row.product_title);
  if (!title) return null;

  const terms: string[] = (row.variation_terms ?? []).filter(Boolean);
  return terms.length > 0 ? `${title} - ${terms.join(" / ")}` : title;
};

export const toProductionOrderItem = (row: any): ProductionOrderItem => ({
  id: row.id,
  // Derivado del producto por fn_production_order_item_label: la columna `name`
  // se retiró de production_order_items. Solo para mostrar, no se edita.
  name: row.name ?? "",
  quantity: Number(row.quantity ?? 0),
  received: Number(row.received ?? 0),
  intakeClosed: row.intake_closed === true,
  routeOutput: toNumberOrNull(row.route_output),
  explosionId: row.explosion_id ?? null,
  explosionDescription: toTextOrNull(row.explosion_description),
  explosionModelCode: toTextOrNull(row.explosion_model_code),
  explosionTotal: toNumberOrNull(row.explosion_total),
  variationId: toNumberOrNull(row.variation_id),
  variationSku: toTextOrNull(row.variation_sku),
  // Producto y talla por separado: es lo que la Orden de Servicio pinta como
  // rejilla. Trae tambien productTitle.
  ...toItemSizeParts(row),
  // El SP ya las manda ordenadas; aquí solo se quedan las urls.
  productImages: (row.images ?? [])
    .map((image: { url?: string }) => image?.url)
    .filter((url: unknown): url is string => typeof url === "string" && url !== ""),
  productId: toNumberOrNull(row.product_id),
  variationLabel: buildVariationLabel(row),
  categories: (row.categories ?? []).map(String),
  tags: (row.tags ?? []).map(String),
});

/** Respuesta de sp_get_production_order_by_id → detalle de UI. */
export const toProductionOrderDetail = (row: any): ProductionOrderDetail => ({
  id: row.id,
  name: row.name ?? "",
  code: toTextOrNull(row.code),
  description: toTextOrNull(row.description),
  quantity: toNumberOrNull(row.quantity),
  productionOrderClassId: row.production_order_class_id,
  productionOrderClassName: row.production_order_class_name ?? "",
  status: row.status ?? "DRAFT",
  type: row.type ?? null,
  createdAt: row.created_at ?? "",
  createdByName: toTextOrNull(row.created_by_name),
  updatedAt: toTextOrNull(row.updated_at),
  promisedDate: toTextOrNull(row.promised_date),
  finishDate: toTextOrNull(row.finish_date),
  items: (row.items ?? []).map(toProductionOrderItem),
  services: (row.services ?? []).map(toLinkedService),
});

/** Fila de sp_get_explosions → opción del combobox de explosiones. */
export const toExplosionOption = (row: any): ExplosionOption => {
  const description = row.description ?? "";
  // Las prendas entran en la etiqueta: es lo que distingue dos recetas que se
  // llaman parecido, y hasta hace poco solo se podia adivinar por la
  // descripcion. Con varias, se listan separadas.
  const variations = row.variations ?? [];
  const variationLabel = variations
    .map((v: any) => v.variation_label)
    .filter(Boolean)
    .join(" · ");

  return {
    id: row.id,
    // Corto: el id y el nombre recortado. La celda de la orden es estrecha y
    // el nombre entero mas las prendas ocupaban la fila.
    // El codigo del molde manda sobre el nombre cuando existe: es como el
    // taller llama a la receta, y cabe entero donde el nombre se recorta.
    label: explosionShortLabel(row.id, row.model_code || description),
    // Y el completo para el title. Las prendas siguen entrando aqui: es lo que
    // distingue dos recetas que se llaman parecido, y perderlo al acortar
    // dejaria dos opciones identicas en el desplegable.
    title: [`#${row.id}`, row.model_code, description, variationLabel]
      .filter(Boolean)
      .join(" · "),
    variationIds: variations.map((v: any) => Number(v.variation_id)),
  };
};
