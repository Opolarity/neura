import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  toMaterialOption,
  toQuotationOption,
  toSupplierService,
  toVariationOption,
} from "../adapters/supplierServices.adapter";
import {
  MaterialOption,
  QuotationOption,
  SupplierClassOption,
  SupplierService,
  SupplierServicesFilters,
  UpdateSupplierServiceData,
  VariationOption,
} from "../types/services.types";

/** Código del módulo del que cuelgan las clases de proveedor. */
const SUPPLIERS_MODULE_CODE = "SPL";

/** Tamaño de los catálogos que alimentan los combobox del modal. */
const OPTIONS_PAGE_SIZE = 100;

/* supplierServicesListApi se retiro con la pantalla de Servicios: era su unico
   consumidor, via useSupplierServices. El resto de este servicio sigue vivo --
   lo usan Cotizaciones y el detalle de la orden de produccion. */

export const updateSupplierServiceApi = async (
  serviceData: UpdateSupplierServiceData
): Promise<void> => {
  const { error } = await supabase.functions.invoke("update-supplier-service", {
    method: "POST",
    body: serviceData,
  });

  if (error) throw error;
};

/**
 * Cotizaciones de proveedor para el combobox.
 * Reutiliza get-quotations-list, que ya pagina y busca sobre
 * supplier_service_quotations.
 */
export const quotationOptionsApi = async (
  search?: string | null
): Promise<QuotationOption[]> => {
  const endpoint = buildEndpoint("get-quotations-list", {
    page: 1,
    size: OPTIONS_PAGE_SIZE,
    search,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return (data?.data?.data ?? []).map(toQuotationOption);
};

/** Materiales para el combobox. Reutiliza get-materials. */
export const materialOptionsApi = async (
  search?: string | null
): Promise<MaterialOption[]> => {
  const endpoint = buildEndpoint("get-materials", {
    page: 1,
    size: OPTIONS_PAGE_SIZE,
    search,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return (data?.materialsdata?.data ?? []).map(toMaterialOption);
};

/**
 * Productos que hoy alcanza algún servicio, para el combo del filtro.
 *
 * No es el catálogo de productos: el SP solo devuelve las variaciones que
 * están en alguna orden con servicios, que son las únicas que pueden devolver
 * filas al filtrar. RPC directa, como supplierClassesApi — no hace falta una
 * edge function para una lista de opciones.
 */
export const variationOptionsApi = async (
  search?: string | null
): Promise<VariationOption[]> => {
  const { data, error } = await (supabase as any).rpc(
    "sp_get_supplier_service_variation_options",
    { p_search: search ?? null }
  );

  if (error) throw error;
  return (data ?? []).map(toVariationOption);
};

/** Clases de proveedor (classes filtradas por modules.code = 'SPL'). */
export const supplierClassesApi = async (): Promise<SupplierClassOption[]> => {
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", SUPPLIERS_MODULE_CODE)
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name, code")
    .eq("module_id", moduleData.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
};
