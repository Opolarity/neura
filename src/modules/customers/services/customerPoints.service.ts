import { supabase } from "@/integrations/supabase/client";
import { CustomerPointsApiResponse } from "../types/customerPoints.types";

export const getCustomerPointsApi = async (
  search: string,
  page: number,
  size: number
): Promise<CustomerPointsApiResponse> => {
  const { data, error } = await supabase.rpc("sp_get_customer_points", {
    p_search: search.trim() || null,
    p_page: page,
    p_size: size,
  });

  if (error) throw error;

  // Cada fila trae total_rows: el total sin paginar.
  const rows = data ?? [];
  return {
    page: { page, size, total: rows[0]?.total_rows ?? 0 },
    data: rows,
  };
};

export const getCustomerPointsMovementsApi = async (
  search: string,
  from: number,
  to: number
) => {
  let query = (supabase as any)
    .from("customer_points_movements")
    .select(
      `
      id,
      quantity,
      note,
      created_at,
      accounts!inner(
        name,
        middle_name,
        last_name,
        last_name2,
        document_number
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search.trim()) {
    query = query.or(
      `name.ilike.%${search}%,last_name.ilike.%${search}%,document_number.ilike.%${search}%`,
      { foreignTable: "accounts" }
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
};
