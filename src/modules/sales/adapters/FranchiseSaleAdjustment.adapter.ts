import type {
  FranchiseLineSaleResponse,
  FranchiseLineSales,
  FranchiseLineSalesResponse,
  FranchiseSaleBlockReason,
  FranchiseSaleStatus,
} from "../types/FranchiseSaleAdjustment.types";

const BLOCK_LABEL: Record<FranchiseSaleBlockReason, string> = {
  sin_pedido: "Sin pedido",
  con_devolucion: "Con devolución",
};

const STATUS_LABEL: Partial<Record<FranchiseSaleStatus, string>> = {
  paid: "Pagada",
  has_return: "Con devolución",
  not_found: "No encontrada",
};

const blockedLabel = (sale: FranchiseLineSaleResponse): string | null => {
  if (sale.blocked_reason) return BLOCK_LABEL[sale.blocked_reason];
  if (sale.franchise_status) return STATUS_LABEL[sale.franchise_status] ?? null;
  return null;
};

export const franchiseLineSalesAdapter = (
  response: FranchiseLineSalesResponse,
): FranchiseLineSales => ({
  sku: response.sku,
  franchiseName: response.franchise_name,
  statusAvailable: response.status_available,
  sales: response.sales.map((sale) => ({
    id: sale.sale_id,
    saleDate: sale.sale_date,
    franchiseOrderId: sale.franchise_order_id,
    quantity: Number(sale.quantity),
    unitPrice: Number(sale.unit_price),
    unitNet: Number(sale.unit_net),
    amount: Number(sale.amount),
    blockedLabel: blockedLabel(sale),
  })),
});
