import { supabase } from "@/integrations/supabase/client";
import { SalesFilters, SalesApiResponse } from "../types/Sales.types";

const SUPABASE_URL = "https://wwcdntjnpoaacarmmzir.supabase.co";

export const fetchSalesList = async (
  filters: SalesFilters
): Promise<SalesApiResponse> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error("No authentication token available");
  }

  const params = new URLSearchParams();
  params.append("page", String(filters.page));
  params.append("size", String(filters.size));

  if (filters.search) {
    params.append("search", filters.search);
  }
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.saleType) {
    params.append("sale_type", String(filters.saleType));
  }
  if (filters.startDate) {
    params.append("start_date", filters.startDate);
  }
  if (filters.endDate) {
    params.append("end_date", filters.endDate);
  }
  if (filters.order) {
    params.append("order", filters.order);
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-sales-list?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al obtener ventas");
  }

  return response.json();
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
