import { supabase } from "@/integrations/supabase/client";

export const getCustomerPointsApi = async (
  search: string,
  from: number,
  to: number
) => {
  let query = supabase
    .from("customer_profile")
    .select(
      `
      id,
      points,
      orders_quantity,
      accounts!inner(
        name,
        middle_name,
        last_name,
        last_name2,
        document_number,
        created_at,
        email,
        document_types(name)
      )
    `,
      { count: "exact" }
    )
    .order("points", { ascending: false })
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
