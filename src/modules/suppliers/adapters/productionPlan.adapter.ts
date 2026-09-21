import {
  ProductionItemDisplay,
  ProductionItemStatus,
  ProductionPlanCategory,
  ProductionPlanProcessCells,
  ProductionPlanProcessColumn,
  ProductionPlanRouteService,
  ProductionPlanRouteStep,
  ProductionPlanRoutes,
  ProductionPlanRow,
} from "../types/productionPlan.types";
import { ProductionOrderStatus } from "../types/productionOrders.types";
import { toItemSizeParts } from "../utils/productionItemDisplay";

const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const numOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const textOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

const toCategory = (row: any): ProductionPlanCategory => ({
  id: num(row?.id),
  name: row?.name ?? "",
});

/**
 * El mapa `processes` de la fila → las celdas de la matriz.
 *
 * `numOrNull` y no `num`: aquí el null tiene que sobrevivir. Convertirlo en 0
 * diría «no salió nada» cuando lo que pasa es que no se sabe cuánto salió.
 */
const toProcessCells = (raw: any): ProductionPlanProcessCells => {
  const salida: ProductionPlanProcessCells = {};
  // Las claves llegan como texto: jsonb_object_agg no admite claves numéricas.
  Object.entries(raw ?? {}).forEach(([processId, celda]) => {
    salida[Number(processId)] = {
      requested: num((celda as any)?.requested),
      good: numOrNull((celda as any)?.good),
      bad: numOrNull((celda as any)?.bad),
      remaining: numOrNull((celda as any)?.remaining),
      isComplete: (celda as any)?.is_complete === true,
      isBlocked: (celda as any)?.is_blocked === true,
      blockedBy: textOrNull((celda as any)?.blocked_by),
    };
  });
  return salida;
};

/** Fila de sp_get_production_plan → modelo de UI. Una fila = una variación. */
export const toProductionPlanRow = (row: any): ProductionPlanRow => ({
  productionOrderItemId: num(row?.production_order_item_id),
  productionOrderId: num(row?.production_order_id),
  productionOrderName: row?.production_order_name ?? "",
  productionOrderCode: textOrNull(row?.production_order_code),
  productionOrderClassId: numOrNull(row?.production_order_class_id),
  productionOrderClassName: textOrNull(row?.production_order_class_name),
  productionOrderStatus: (row?.production_order_status ??
    "DRAFT") as ProductionOrderStatus,
  promisedDate: textOrNull(row?.promised_date),
  createdAt: textOrNull(row?.created_at),
  productId: numOrNull(row?.product_id),
  productTitle: textOrNull(row?.product_title),
  categories: (row?.categories ?? []).map(toCategory),
  variationId: numOrNull(row?.variation_id),
  sku: textOrNull(row?.sku),
  variationTerms: textOrNull(row?.variation_terms),
  termId: numOrNull(row?.term_id),
  // El backend ya manda «—» para la variación sin talla; el fallback es para
  // una respuesta incompleta, no para el caso normal.
  termName: row?.term_name ?? "—",
  termGroupId: numOrNull(row?.term_group_id),
  termGroupName: textOrNull(row?.term_group_name),
  quantity: num(row?.quantity),
  received: num(row?.received),
  pending: num(row?.pending),
  status: (row?.status ?? "PENDING") as ProductionItemStatus,
  routeDone: row?.route_done === true,
  intakeClosed: row?.intake_closed === true,
  processes: toProcessCells(row?.processes),
});

/** La clave `processes` de sp_get_production_plan → las columnas de la tabla. */
export const toProductionPlanProcessColumns = (
  raw: any,
): ProductionPlanProcessColumn[] =>
  (raw ?? []).map((row: any) => ({
    processId: numOrNull(row?.process_id),
    // Un servicio al que aún no se le puso proceso en la ruta: mismo rótulo
    // que usa el paso de la ruta, para que no se lean como cosas distintas.
    processName: row?.process_name ?? "Sin proceso",
    processGroupId: numOrNull(row?.process_group_id),
    processGroupName: textOrNull(row?.process_group_name),
  }));

const toRouteService = (row: any): ProductionPlanRouteService => ({
  supplierServiceId: num(row?.supplier_service_id),
  serviceCode: textOrNull(row?.service_code),
  serviceDescription: row?.service_description ?? "",
  moduleId: num(row?.module_id),
  materialId: numOrNull(row?.material_id),
  materialMeasurementUnit: textOrNull(row?.material_measurement_unit),
  supplierId: numOrNull(row?.supplier_id),
  supplierName: textOrNull(row?.supplier_name),
  supplierDocumentType: textOrNull(row?.supplier_document_type),
  supplierDocumentNumber: textOrNull(row?.supplier_document_number),
  supplierAddress: textOrNull(row?.supplier_address),
  supplierPhone: textOrNull(row?.supplier_phone),
  situationRowId: numOrNull(row?.situation_row_id),
  situationId: numOrNull(row?.situation_id),
  situationName: row?.situation_name ?? "",
  dispatched: row?.dispatched === true,
  promisedDate: textOrNull(row?.promised_date),
  // Cuándo terminó de verdad: la pone la situación de finalización.
  endDate: textOrNull(row?.end_date),
  // Lo pactado en la cotización: rige los importes de la Orden de Servicio.
  currency: textOrNull(row?.currency),
  paymentTerms: textOrNull(row?.payment_terms),
  quantity: numOrNull(row?.quantity),
  requestedQuantity: numOrNull(row?.requested_quantity),
  incomingQuantity: numOrNull(row?.incoming_quantity),
  badQuantity: numOrNull(row?.bad_quantity),
  price: numOrNull(row?.price),
  measurementUnit: textOrNull(row?.measurement_unit),
  itemIds: (row?.production_order_item_ids ?? []).map((id: unknown) => num(id)),
  itemNames: (row?.production_order_item_names ?? []).map((name: unknown) =>
    String(name ?? ""),
  ),
  itemDetails: (row?.production_order_item_details ?? []).map(
    (detail: any): ProductionItemDisplay => ({
      id: num(detail?.id),
      ...toItemSizeParts(detail),
      variationTerms: textOrNull(detail?.variation_terms),
      sku: textOrNull(detail?.sku),
    }),
  ),
});

const toRouteStep = (row: any): ProductionPlanRouteStep => ({
  order: num(row?.order),
  processId: numOrNull(row?.process_id),
  // Un paso sin proceso asignado existe: es un servicio vinculado a la orden
  // al que todavía no se le puso proceso en la configuración de la ruta.
  processName: row?.process_name ?? "Sin proceso",
  processGroupId: numOrNull(row?.process_group_id),
  processGroupName: textOrNull(row?.process_group_name),
  stepsTotal: num(row?.steps_total),
  stepsDone: num(row?.steps_done),
  isComplete: row?.is_complete === true,
  isBlocked: row?.is_blocked === true,
  blockedBy: textOrNull(row?.blocked_by),
  progress: {
    requested: num(row?.progress?.requested),
    advanced: num(row?.progress?.advanced),
    bad: num(row?.progress?.bad),
    remaining: num(row?.progress?.remaining),
  },
  services: (row?.services ?? []).map(toRouteService),
});

/** El mapa `routes` de sp_get_production_plan → modelo de UI. */
export const toProductionPlanRoutes = (raw: any): ProductionPlanRoutes => {
  const salida: ProductionPlanRoutes = {};
  // Las claves llegan como texto: jsonb_object_agg no admite claves numéricas.
  Object.entries(raw ?? {}).forEach(([orderId, steps]) => {
    salida[Number(orderId)] = ((steps as any[]) ?? []).map(toRouteStep);
  });
  return salida;
};
