import { supabase } from "@/integrations/supabase/client";

export interface POSSessionListItem {
  id: number;
  userName: string;
  branchName: string;
  warehouseName: string;
  statusName: string;
  statusCode: string;
  openingAmount: number;
  closingAmount: number | null;
  totalSales: number | null;
  difference: number | null;
  openedAt: string;
  closedAt: string | null;
}

export interface POSSessionsFilters {
  search: string | null;
  statusId: number | null;
  page: number;
  size: number;
}

export interface POSSessionsResponse {
  sessions: POSSessionListItem[];
  total: number;
}

export const fetchPOSSessions = async (
  filters: POSSessionsFilters
): Promise<POSSessionsResponse> => {
  const { page, size, search, statusId } = filters;
  const from = (page - 1) * size;
  const to = from + size - 1;

  // Build base query for count
  let countQuery = supabase
    .from("pos_sessions")
    .select("id", { count: "exact", head: true });

  let dataQuery = supabase
    .from("pos_sessions")
    .select("id, opening_amount, total_sales, difference, opened_at, closed_at, status_id, user_id, branch_id, warehouse_id")
    .order("id", { ascending: false })
    .range(from, to);

  if (statusId) {
    countQuery = countQuery.eq("status_id", statusId);
    dataQuery = dataQuery.eq("status_id", statusId);
  }

  const [{ count, error: countError }, { data, error }] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  if (countError) throw countError;
  if (error) throw error;

  // Fetch related data
  const userIds = [...new Set((data || []).map((s) => s.user_id))];
  const branchIds = [...new Set((data || []).map((s) => s.branch_id))];
  const warehouseIds = [...new Set((data || []).map((s) => s.warehouse_id))];
  const statusIds = [...new Set((data || []).map((s) => s.status_id))];

  const [profiles, branches, warehouses, statuses] = await Promise.all([
    supabase
      .from("profiles")
      .select("UID, account_id")
      .in("UID", userIds)
      .then(async (res) => {
        if (res.error) throw res.error;
        const accountIds = res.data.map((p) => p.account_id);
        const { data: accounts, error: accErr } = await supabase
          .from("accounts")
          .select("id, name, last_name")
          .in("id", accountIds);
        if (accErr) throw accErr;
        return res.data.map((p) => {
          const acc = accounts?.find((a) => a.id === p.account_id);
          return {
            uid: p.UID,
            name: acc ? `${acc.name} ${acc.last_name || ""}`.trim() : "—",
          };
        });
      }),
    supabase
      .from("branches")
      .select("id, name")
      .in("id", branchIds)
      .then((r) => r.data || []),
    supabase
      .from("warehouses")
      .select("id, name")
      .in("id", warehouseIds)
      .then((r) => r.data || []),
    supabase
      .from("statuses")
      .select("id, name, code")
      .in("id", statusIds)
      .then((r) => r.data || []),
  ]);

  const sessions: POSSessionListItem[] = (data || []).map((s) => {
    const profile = profiles.find((p) => p.uid === s.user_id);
    const branch = branches.find((b) => b.id === s.branch_id);
    const warehouse = warehouses.find((w) => w.id === s.warehouse_id);
    const status = statuses.find((st) => st.id === s.status_id);

    return {
      id: s.id,
      userName: profile?.name || "—",
      branchName: branch?.name || "—",
      warehouseName: warehouse?.name || "—",
      statusName: status?.name || "—",
      statusCode: status?.code || "",
      openingAmount: s.opening_amount,
      closingAmount: null,
      totalSales: s.total_sales,
      difference: s.difference,
      openedAt: s.opened_at,
      closedAt: s.closed_at,
    };
  });

  // Filter by search (client-side for user/branch names)
  let filtered = sessions;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = sessions.filter(
      (s) =>
        s.userName.toLowerCase().includes(searchLower) ||
        s.branchName.toLowerCase().includes(searchLower) ||
        s.id.toString().includes(searchLower)
    );
  }

  return {
    sessions: filtered,
    total: search ? filtered.length : (count ?? 0),
  };
};
