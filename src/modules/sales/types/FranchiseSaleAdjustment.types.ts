/** Ajuste manual del precio de una venta de franquicia (T-1129). */

export type FranchiseSaleBlockReason = "sin_pedido" | "con_devolucion";

// Lo que responde el ERP del franquiciado: es quien sabe si la venta se pagó.
export type FranchiseSaleStatus = "ok" | "paid" | "has_return" | "not_found";

export type FranchiseLineSaleResponse = {
  sale_id: number;
  sale_date: string;
  franchise_order_id: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  unit_net: number;
  amount: number;
  blocked_reason: FranchiseSaleBlockReason | null;
  franchise_status: FranchiseSaleStatus | null;
};

export type FranchiseLineSalesResponse = {
  order_product_id: number;
  order_id: number;
  sku: string | null;
  tenant_reference: string | null;
  franchise_name: string | null;
  status_available: boolean;
  sales: FranchiseLineSaleResponse[];
};

export type FranchiseLineSale = {
  id: number;
  saleDate: string;
  franchiseOrderId: string | null;
  quantity: number;
  unitPrice: number;
  unitNet: number;
  amount: number;
  // Null: se puede ajustar.
  blockedLabel: string | null;
};

export type FranchiseLineSales = {
  sku: string | null;
  franchiseName: string | null;
  statusAvailable: boolean;
  sales: FranchiseLineSale[];
};

export type AdjustFranchiseSalePayload = {
  saleId: number;
  newUnitPrice: number;
  reason: string;
  adjustmentKey: string;
};
