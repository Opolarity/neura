import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";

export type FranchiseProductRow = {
  id: number;
  productName: string;
  orderId: number;
  quantity: number;
  soldByFranchise: number | null;
  productPrice: number;
  paidByFranchise: number | null;
  total: number;
  franchiseName: string | null;
  isFranchisee: boolean;
};

export type FranchiseProductsFilters = {
  page: number;
  size: number;
  search?: string;
  franchisee_only?: boolean;
  date_from?: string;
  date_to?: string;
  payment_statuses?: FranchisePaymentStatus[];
  sales_status?: FranchiseSalesStatus;
};

export type FranchisePaymentStatus = "paid" | "unpaid" | "partial";
export type FranchiseSalesStatus = "all" | "with_sales" | "without_sales";

export type FranchiseSummary = {
  totalSent: number;
  totalSold: number;
  totalPaid: number;
  totalPending: number;
};

export type FranchiseProductsResponse = {
  data: FranchiseProductRow[];
  pagination: PaginationState;
  summary: FranchiseSummary;
};

type RawFranchiseProduct = {
  id: number;
  order_id: number;
  product_name: string;
  product_price: number | string | null;
  quantity: number | string | null;
  sold_by_franchise: number | string | null;
  paid_by_franchise: number | string | null;
  franchise_name: string | null;
  is_franchisee: boolean;
};

const toNumber = (value: number | string | null | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toNullableNumber = (
  value: number | string | null | undefined,
): number | null => {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const fetchFranchiseProducts = async (
  filters: FranchiseProductsFilters,
): Promise<FranchiseProductsResponse> => {
  const endpoint = buildEndpoint("get-franchise-products-list", {
    page: filters.page,
    size: filters.size,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.franchisee_only ? { franchisee_only: true } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.payment_statuses?.length
      ? { payment_statuses: filters.payment_statuses.join(",") }
      : {}),
    ...(filters.sales_status ? { sales_status: filters.sales_status } : {}),
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const rows: FranchiseProductRow[] = ((data?.data ?? []) as RawFranchiseProduct[]).map(
    (item) => {
      const quantity = toNumber(item.quantity);
      const productPrice = toNumber(item.product_price);
      return {
        id: item.id,
        productName: item.product_name ?? "-",
        orderId: item.order_id,
        quantity,
        soldByFranchise: toNullableNumber(item.sold_by_franchise),
        productPrice,
        paidByFranchise: toNullableNumber(item.paid_by_franchise),
        total: productPrice * quantity,
        franchiseName: item.franchise_name ?? null,
        isFranchisee: item.is_franchisee ?? false,
      };
    },
  );

  const pagination: PaginationState = {
    p_page: data?.page?.p_page ?? filters.page,
    p_size: data?.page?.p_size ?? filters.size,
    total: data?.page?.total ?? 0,
  };

  const totalSent = toNumber(data?.summary?.total_sent);
  const totalSold = toNumber(data?.summary?.total_sold);
  const totalPaid = toNumber(data?.summary?.total_paid);
  const summary: FranchiseSummary = {
    totalSent,
    totalSold,
    totalPaid,
    totalPending: totalSold - totalPaid,
  };

  return { data: rows, pagination, summary };
};
