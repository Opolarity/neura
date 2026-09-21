import {
  MaterialRequirement,
  MaterialRequirementItem,
  MaterialRequirementRow,
} from "../types/materialRequirement.types";

const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const textOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

const numOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toRow = (row: any): MaterialRequirementRow => ({
  materialId: row.material_id,
  materialName: row.material_name ?? "",
  measurementUnit: row.measurement_unit ?? "",
  materialClassId: numOrNull(row.material_class_id),
  materialClassName: textOrNull(row.material_class_name),
  totalRequired: num(row.total_required),
  stock: num(row.stock),
  stockOwn: num(row.stock_own),
  stockAtSuppliers: num(row.stock_at_suppliers),
  missing: num(row.missing),
  unitCost: numOrNull(row.unit_cost),
  totalCost: numOrNull(row.total_cost),
  breakdown: (row.breakdown ?? []).map((b: any) => ({
    productionOrderItemId: b.production_order_item_id,
    itemName: b.item_name ?? "",
    itemQuantity: num(b.item_quantity),
    unitConsumption: num(b.unit_consumption),
    required: num(b.required),
  })),
});

const toItem = (row: any): MaterialRequirementItem => ({
  productionOrderItemId: row.production_order_item_id,
  itemLabel: row.item_label ?? "",
  productTitle: textOrNull(row.product_title),
  variationTerms: (row.variation_terms ?? []).filter(Boolean).map(String),
  variationSku: row.variation_sku ?? null,
  itemQuantity: num(row.item_quantity),
  subtotalCost: num(row.subtotal_cost),
  hasShortage: row.has_shortage === true,
  materials: (row.materials ?? []).map((m: any) => ({
    materialId: m.material_id,
    materialName: m.material_name ?? "",
    measurementUnit: m.measurement_unit ?? "",
    materialClassId: numOrNull(m.material_class_id),
    materialClassName: textOrNull(m.material_class_name),
    unitConsumption: num(m.unit_consumption),
    required: num(m.required),
    stock: num(m.stock),
    stockOwn: num(m.stock_own),
    stockAtSuppliers: num(m.stock_at_suppliers),
    missing: num(m.missing),
    unitCost: numOrNull(m.unit_cost),
    cost: numOrNull(m.cost),
    sharePct: numOrNull(m.share_pct),
  })),
});

/** Respuesta de sp_get_production_order_material_requirement → modelo de UI. */
export const toMaterialRequirement = (row: any): MaterialRequirement => ({
  productionOrderId: row?.production_order_id ?? 0,
  materials: (row?.materials ?? []).map(toRow),
  items: (row?.items ?? []).map(toItem),
  estimatedTotalCost: num(row?.estimated_total_cost),
  hasShortage: row?.has_shortage === true,
});
