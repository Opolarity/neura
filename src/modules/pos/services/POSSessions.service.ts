import { supabase } from "@/integrations/supabase/client";

export interface POSSessionListItem {
  id: number;
  userName: string;
  branchName: string;
  statusCode: string;
  openingAmount: number;
  closingAmount: number | null;
  totalSales: number | null;
  openingDifference: number;
  difference: number | null;
  openedAt: string;
  closedAt: string | null;
}

export interface POSSessionsFilters {
  search: string | null;
  statusId: number | null;
  page: number;
  size: number;
  dateFrom: string | null;
  dateTo: string | null;
  differenceType: string | null;
  salesMin: number | null;
  salesMax: number | null;
  orderBy: string;
}

export interface POSSessionsResponse {
  sessions: POSSessionListItem[];
  total: number;
}

export const fetchPOSSessions = async (
  filters: POSSessionsFilters
): Promise<POSSessionsResponse> => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.search) params.set("search", filters.search);
  if (filters.statusId) params.set("status_id", String(filters.statusId));
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.differenceType) params.set("difference_type", filters.differenceType);
  if (filters.salesMin !== null) params.set("sales_min", String(filters.salesMin));
  if (filters.salesMax !== null) params.set("sales_max", String(filters.salesMax));
  params.set("order_by", filters.orderBy);

  const { data, error } = await supabase.functions.invoke(
    "get-pos-sessions-list?" + params.toString(),
    { method: "GET" }
  );

  if (error) throw error;

  const rpcResult = data?.sessions_data;
  if (!rpcResult) throw new Error("No data returned from RPC");

  const rawSessions = rpcResult.data || [];

  // Fetch statuses to get codes
  const statusIdsSet = new Set<number>(rawSessions.map((s: any) => s.status_id));
  const statusIds: number[] = Array.from(statusIdsSet);
  const { data: statuses } = await supabase
    .from("statuses")
    .select("id, code")
    .in("id", statusIds);

  const sessions: POSSessionListItem[] = rawSessions.map((s: any) => {
    const status = statuses?.find((st) => st.id === s.status_id);
    return {
      id: s.id,
      userName: `${s.user_name || ""} ${s.user_last_name || ""}`.trim() || "—",
      branchName: s.branch_name || "—",
      statusCode: status?.code || "",
      openingAmount: s.opening_amount,
      closingAmount: s.closing_amount ?? null,
      totalSales: s.total_sales ?? null,
      openingDifference: s.opening_difference ?? 0,
      difference: s.difference ?? null,
      openedAt: s.opened_at,
      closedAt: s.closed_at,
    };
  });

  return {
    sessions,
    total: rpcResult.total ?? 0,
  };
};
