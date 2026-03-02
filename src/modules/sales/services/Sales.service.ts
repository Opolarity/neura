import { supabase } from "@/integrations/supabase/client";
import { SalesFilters, SalesApiResponse } from "../types/Sales.types";
import { buildEndpoint } from "@/shared/utils/utils";

export const fetchSalesList = async (
  filters: SalesFilters
): Promise<SalesApiResponse> => {
  const params: Record<string, string> = {
    page: String(filters.page),
    size: String(filters.size),
  };

  if (filters.search) params.search = filters.search;
  if (filters.situationId) params.situation_id = String(filters.situationId);
  if (filters.saleType) params.sale_type = String(filters.saleType);
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.order) params.order = filters.order;

  const endpoint = buildEndpoint("get-sales-list", params);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return data;
};

export const fetchSaleTypes = async (): Promise<{ id: number; name: string }[]> => {
  const { data, error } = await supabase
    .from("sale_types")
    .select("id, name")
    .eq("is_active", true);

  if (error) throw error;
  return data || [];
};

export const fetchSaleSituations = async (): Promise<{ id: number; name: string }[]> => {
  const { data, error } = await supabase
    .from("situations")
    .select("id, name, modules!inner(code)")
    .eq("modules.code", "ORD");

  if (error) throw error;
  return (data || []).map((s: any) => ({ id: s.id, name: s.name }));
};
