import {
  MaterialOption,
  QuotationOption,
  ServiceVariation,
  SupplierService,
  VariationOption,
} from "../types/services.types";

/** Convierte "" y null en null; el resto lo deja como string. */
const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

/** Convierte a número, respetando el null (0 es un valor válido). */
const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
};

/**
 * Fila de sp_get_supplier_services → modelo de UI.
 *
 * Capa anticorrupción: si el backend cambia el nombre de una clave,
 * se ajusta aquí y ni la page ni el hook se enteran.
 */
export const toSupplierService = (row: any): SupplierService => ({
  id: row.id,
  description: row.description ?? "",
  code: toTextOrNull(row.code),
  supplierQuotationId: row.supplier_quotation_id,
  quotationCode: toTextOrNull(row.quotation_code),
  quotationDescription: row.quotation_description ?? "",
  supplierId: row.supplier_id,
  supplierName: row.supplier_name ?? "",
  materialId: row.material_id ?? null,
  materialName: toTextOrNull(row.material_name),
  materialMeasurementUnit: toTextOrNull(row.material_measurement_unit),
  materialUnitCost: toNumberOrNull(row.material_unit_cost),
  supplierClassId: row.supplier_class_id,
  supplierClassName: row.supplier_class_name ?? "",
  moduleId: row.module_id,
  statusId: row.status_id,
  statusName: row.status_name ?? "",
  situationId: row.situation_id,
  situationName: row.situation_name ?? "",
  situationCode: toTextOrNull(row.situation_code),
  situationRowId: toNumberOrNull(row.situation_row_id),
  situationAt: toTextOrNull(row.situation_at),
  promisedDate: toTextOrNull(row.promised_date),
  quantity: toNumberOrNull(row.quantity),
  requestedQuantity: toNumberOrNull(row.requested_quantity),
  isLocked: row.is_locked === true,
  badQuantity: toNumberOrNull(row.bad_quantity),
  price: toNumberOrNull(row.price),
  measurementUnit: toTextOrNull(row.measurement_unit),
  productionOrderId: toNumberOrNull(row.production_order_id),
  productionOrderName: toTextOrNull(row.production_order_name),
  variations: (row.variations ?? []).map(toServiceVariation),
  createdAt: row.created_at ?? "",
});

/** Entrada del array `variations` de sp_get_supplier_services. */
export const toServiceVariation = (row: any): ServiceVariation => ({
  variationId: row.variation_id,
  sku: toTextOrNull(row.sku),
  productTitle: toTextOrNull(row.product_title),
});

/** Fila de sp_get_supplier_service_variation_options → opción del filtro. */
export const toVariationOption = (row: any): VariationOption => ({
  id: row.id,
  sku: toTextOrNull(row.sku),
  productTitle: toTextOrNull(row.product_title),
  label: row.label ?? `#${row.id}`,
});

/**
 * Fila de sp_get_quotations_list → opción del combobox.
 *
 * Ese SP no devuelve el `code` de la cotización, así que la etiqueta se
 * compone con id, descripción y proveedor, que es lo que sí trae.
 */
export const toQuotationOption = (row: any): QuotationOption => {
  const description = row.subject ?? row.request_description ?? "";
  const supplierName = row.supplier_name ?? "";

  return {
    id: row.id,
    description,
    supplierName,
    label: [`#${row.id}`, description, supplierName]
      .filter(Boolean)
      .join(" · "),
  };
};

/** Fila de sp_get_materials → opción del combobox de materiales. */
export const toMaterialOption = (row: any): MaterialOption => ({
  id: row.id,
  name: row.name ?? "",
  unitCost: toNumberOrNull(row.unit_cost),
  measurementUnit: toTextOrNull(row.measurement_unit),
  materialClassId: toNumberOrNull(row.material_class_id),
  materialClassName: toTextOrNull(row.material_class_name),
});
