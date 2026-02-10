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
  if (filters.status) params.status = filters.status;
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
    .from("types")
    .select("id, name")
    .eq("module_id", 2); // Assuming module_id 2 is for sale types

  if (error) throw error;
  return data || [];
};

export const fetchSaleStatuses = async (): Promise<{ code: string; name: string }[]> => {
  const { data, error } = await supabase
    .from("statuses")
    .select("code, name")
    .eq("module_id", 2); // Assuming module_id 2 is for orders

  if (error) throw error;
  return data || [];
};
