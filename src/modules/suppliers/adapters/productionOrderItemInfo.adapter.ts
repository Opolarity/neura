import {
  ItemInfoStep,
  ProductionOrderItemInfo,
} from "../types/productionOrderItemInfo.types";

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

/** Los numéricos de Postgres llegan como string por JSON. */
const toNumber = (value: unknown): number => Number(value ?? 0);

const toStep = (row: any): ItemInfoStep => ({
  productionOrderInfoId: row.production_order_info_id,
  order: toNumber(row.order),
  processName: toTextOrNull(row.process_name),
  processGroupName: toTextOrNull(row.process_group_name),
  serviceDescription: toTextOrNull(row.service_description),
});

/**
 * Respuesta de sp_get_production_order_item_info → modelo de UI.
 *
 * `by_process` son todos los pasos de la orden, vinculados o no: de ahí
 * salen las columnas de la matriz. Aquí se llama `steps`, que es lo que son.
 */
export const toProductionOrderItemInfo = (
  row: any
): ProductionOrderItemInfo => ({
  productionOrderId: row.production_order_id,
  productionOrderName: row.production_order_name ?? "",
  items: (row.items ?? []).map((item: any) => ({
    id: item.id,
    name: item.name ?? "",
    planned: toNumber(item.planned),
    steps: (item.steps ?? []).map(toStep),
  })),
  steps: (row.by_process ?? []).map(toStep),
});
