import {
  ProcessGroupState,
  ProcessItemProgress,
  ProcessServiceStep,
  ProcessStep,
  ProductionOrderProcesses,
  ServiceProcesses,
} from "../types/productionOrderProcesses.types";
import { toItemSizeParts } from "../utils/productionItemDisplay";

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStep = (row: any): ProcessStep => ({
  id: row.id,
  order: Number(row.order ?? 1),
  processId: row.process_id ?? null,
  processName: toTextOrNull(row.process_name),
  processGroupId: row.process_group_id ?? null,
  processGroupName: toTextOrNull(row.process_group_name),
  // Un servicio puede cubrir varias prendas, y la matriz es la única vía.
  productionOrderItemIds: (row.production_order_item_ids ?? []).map(Number),
});


const toProcessServiceStep = (row: any): ProcessServiceStep => ({
  id: row.id,
  supplierServiceId: row.supplier_service_id ?? null,
  serviceCode: toTextOrNull(row.service_code),
  serviceDescription: toTextOrNull(row.service_description),
  promisedDate: toTextOrNull(row.promised_date),
  situationCode: toTextOrNull(row.situation_code),
  situationName: toTextOrNull(row.situation_name),
  productionOrderItemIds: (row.production_order_item_ids ?? []).map(Number),
  productionOrderItemNames: (row.production_order_item_names ?? []).map(String),
  isDone: row.is_done === true,
});

const toProcessItemProgress = (row: any): ProcessItemProgress => ({
  productionOrderItemId: Number(row.production_order_item_id),
  requested: Number(row.requested ?? 0),
  // null significa "no se puede saber", que no es lo mismo que cero: se
  // conserva para que la tabla pinte un guion en vez de un 0 que mentiría.
  advanced: toNumberOrNull(row.advanced),
  bad: toNumberOrNull(row.bad),
  remaining: toNumberOrNull(row.remaining),
});

const toProcessGroupState = (row: any): ProcessGroupState => ({
  order: Number(row.order ?? 1),
  processId: row.process_id ?? null,
  processName: toTextOrNull(row.process_name),
  processGroupId: row.process_group_id ?? null,
  processGroupName: toTextOrNull(row.process_group_name),
  stepsTotal: Number(row.steps_total ?? 0),
  stepsDone: Number(row.steps_done ?? 0),
  isComplete: row.is_complete === true,
  isBlocked: row.is_blocked === true,
  blockedBy: toTextOrNull(row.blocked_by),
  progress: {
    requested: Number(row.progress?.requested ?? 0),
    advanced: Number(row.progress?.advanced ?? 0),
    bad: Number(row.progress?.bad ?? 0),
    remaining: Number(row.progress?.remaining ?? 0),
  },
  itemProgress: (row.item_progress ?? []).map(toProcessItemProgress),
  steps: (row.steps ?? []).map(toProcessServiceStep),
});

const toServiceProcesses = (row: any): ServiceProcesses => ({
  supplierServiceId: row.supplier_service_id,
  serviceCode: toTextOrNull(row.service_code),
  serviceDescription: row.service_description ?? "",
  supplierQuotationId: toNumberOrNull(row.supplier_quotation_id),
  quotationCode: toTextOrNull(row.quotation_code),
  quotationDescription: row.quotation_description ?? "",
  quotationNotes: toTextOrNull(row.quotation_notes),
  promisedDate: toTextOrNull(row.promised_date),
  // Lo pactado en la cotización: rige los importes de la Orden de Servicio.
  currency: toTextOrNull(row.currency),
  paymentTerms: toTextOrNull(row.payment_terms),
  quotationCreatedAt: toTextOrNull(row.quotation_created_at),
  moduleId: row.module_id,
  situationId: toNumberOrNull(row.situation_id),
  situationName: row.situation_name ?? "",
  situationRowId: toNumberOrNull(row.situation_row_id),
  quantity: toNumberOrNull(row.quantity),
  requestedQuantity: toNumberOrNull(row.requested_quantity),
  incomingQuantity: toNumberOrNull(row.incoming_quantity),
  isLocked: row.is_locked === true,
  badQuantity: toNumberOrNull(row.bad_quantity),
  price: toNumberOrNull(row.price),
  measurementUnit: toTextOrNull(row.measurement_unit),
  materialId: toNumberOrNull(row.material_id),
  materialMeasurementUnit: toTextOrNull(row.material_measurement_unit),
  supplierId: toNumberOrNull(row.supplier_id),
  supplierName: toTextOrNull(row.supplier_name),
  supplierDocumentType: toTextOrNull(row.supplier_document_type),
  supplierDocumentNumber: toTextOrNull(row.supplier_document_number),
  supplierAddress: toTextOrNull(row.supplier_address),
  supplierPhone: toTextOrNull(row.supplier_phone),
  steps: (row.steps ?? []).map((step: any) => toStep(step)),
});

/**
 * Respuesta de sp_get_production_order_processes → modelo de UI.
 *
 * El anidado servicio→pasos ya viene armado del SP, así que aquí solo se
 * traducen los nombres de las claves.
 */
export const toProductionOrderProcesses = (
  row: any
): ProductionOrderProcesses => ({
  productionOrderId: row.production_order_id,
  productionOrderName: row.production_order_name ?? "",
  items: (row.items ?? []).map((i: any) => ({
    id: i.id,
    name: i.name ?? "",
    quantity: Number(i.quantity ?? 0),
    // Producto y talla por separado, para la rejilla de la Orden de Servicio.
    ...toItemSizeParts(i),
    variationTerms: i.variation_terms ?? null,
    sku: i.sku ?? null,
    routeDone: i.route_done === true,
  })),
  services: (row.services ?? []).map(toServiceProcesses),
  processes: (row.processes ?? []).map(toProcessGroupState),
});
