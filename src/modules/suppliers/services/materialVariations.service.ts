import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import {
  MaterialVariationOption,
  MaterialVariationOptionApi,
  MaterialVariationOptionsFilters,
} from "../types/materialVariations.types";
import { MaterialStockEntry } from "../types/materials.types";

export const toMaterialVariationOption = (
  raw: MaterialVariationOptionApi,
): MaterialVariationOption => ({
  id: Number(raw.id),
  code: raw.code ?? "",
  materialId: Number(raw.material_id),
  materialName: raw.material_name ?? "",
  termsLabel: raw.terms_label ?? null,
  label: raw.label ?? raw.material_name ?? "",
  measurementUnit: raw.measurement_unit ?? "",
  unitCost: raw.unit_cost === null || raw.unit_cost === undefined ? null : Number(raw.unit_cost),
  supplierId: raw.supplier_id ?? null,
  supplierName: raw.supplier_name ?? null,
  materialClassId: raw.material_class_id ?? null,
  materialClassName: raw.material_class_name ?? "",
  isActive: raw.is_active !== false,
});

/**
 * Las variaciones de material para un selector: una opción por variación
 * activa. La búsqueda va por palabras y sin tildes ("boton negro").
 */
export const materialVariationOptionsApi = async (
  filters: MaterialVariationOptionsFilters = {},
): Promise<MaterialVariationOption[]> => {
  const endpoint = buildEndpoint("get-material-variation-options", {
    search: filters.search || undefined,
    size: filters.size ?? 50,
    material_id: filters.materialId ?? undefined,
    ids: filters.ids && filters.ids.length > 0 ? filters.ids.join(",") : undefined,
  });
  const response = await invokeFunction<{ data?: MaterialVariationOptionApi[] }>(endpoint, {
    method: "GET",
  });
  return (response?.data ?? []).map(toMaterialVariationOption);
};

/**
 * El saldo de una variación, por almacén y tipo. Lectura directa como la del
 * material: RLS acota por tenant y son las filas de la tabla tal cual.
 */
export const materialVariationStockApi = async (
  materialVariationId: number,
): Promise<MaterialStockEntry[]> => {
  // `as any`, igual que materialStockApi: los tipos generados de la base aún
  // no conocen material_variation_id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("material_stock")
    .select("warehouse_id, stock_type_id, stock")
    .eq("material_variation_id", materialVariationId);

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    warehouseId: row.warehouse_id,
    stockTypeId: row.stock_type_id,
    stock: Number(row.stock ?? 0),
  }));
};
