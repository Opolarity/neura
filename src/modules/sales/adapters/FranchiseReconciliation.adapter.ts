import { PaginationState } from "@/shared/components/pagination/Pagination";
import { FranchiseCategory } from "../types/FranchiseStock.types";
import {
  FranchiseReconciliationApiResponse,
  FranchiseReconciliationRow,
  FranchiseReconciliationTotals,
} from "../types/FranchiseReconciliation.types";

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableNumber = (value: unknown): number | null =>
  value === null || value === undefined ? null : toNumber(value);

export const franchiseReconciliationAdapter = (
  response: FranchiseReconciliationApiResponse,
) => {
  const rows: FranchiseReconciliationRow[] = (response?.data ?? []).map((item) => ({
    sku: item.sku ?? "",
    productName: item.product_name ?? "",
    variationName: item.variation_name ?? "",
    sent: toNumber(item.sent),
    received: toNumber(item.received),
    sold: toNumber(item.sold),
    returned: toNumber(item.returned),
    inTransit: toNumber(item.in_transit),
    expected: toNumber(item.expected),
    physical: toNumber(item.physical),
    difference: toNumber(item.difference),
    minPrice: toNullableNumber(item.min_price),
    maxPrice: toNullableNumber(item.max_price),
    balanceValue: toNumber(item.balance_value),
    status: item.status,
    reviewReasons: item.review_reasons ?? [],
  }));

  const totals: FranchiseReconciliationTotals = {
    sent: toNumber(response?.totals?.sent),
    received: toNumber(response?.totals?.received),
    sold: toNumber(response?.totals?.sold),
    returned: toNumber(response?.totals?.returned),
    inTransit: toNumber(response?.totals?.in_transit),
    expected: toNumber(response?.totals?.expected),
    physical: toNumber(response?.totals?.physical),
    balanceValue: toNumber(response?.totals?.balance_value),
    inactiveUnits: toNumber(response?.totals?.inactive_units),
    counts: {
      ok: toNumber(response?.totals?.count_ok),
      shortage: toNumber(response?.totals?.count_shortage),
      surplus: toNumber(response?.totals?.count_surplus),
      review: toNumber(response?.totals?.count_review),
    },
  };

  const categories: FranchiseCategory[] = (response?.categories ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? "",
    parentId: c.parent_id ?? null,
  }));

  const pagination: PaginationState = {
    p_page: toNumber(response?.page?.page) || 1,
    p_size: toNumber(response?.page?.size) || 20,
    total: toNumber(response?.page?.total),
  };

  return { data: rows, totals, categories, pagination };
};
