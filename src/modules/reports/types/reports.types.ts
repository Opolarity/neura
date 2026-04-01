// ============================================================
// REPORTS MODULE — TYPE DEFINITIONS
// ============================================================

// -------------------------------------------------------
// Shared Filter State
// -------------------------------------------------------
export interface ReportsFilters {
  startDate: string | null; // ISO date string YYYY-MM-DD
  endDate: string | null;
  branchId: number | null;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
}

export const DEFAULT_REPORTS_FILTERS: ReportsFilters = {
  startDate: null,
  endDate: null,
  branchId: null,
  countryId: null,
  stateId: null,
  cityId: null,
};

// -------------------------------------------------------
// Branch / Location lookup
// -------------------------------------------------------
export interface BranchOption {
  id: number;
  name: string;
}

export interface LocationOption {
  id: number;
  name: string;
}

// -------------------------------------------------------
// Sales Dashboard
// -------------------------------------------------------
export interface SalesKpis {
  total_revenue: number;
  order_count: number;
  avg_ticket: number;
  total_discount: number;
  total_shipping: number;
}

export interface SalesOverTimeItem {
  period: string; // ISO date
  order_count: number;
  total_revenue: number;
  avg_ticket: number;
}

export interface SalesByDimensionItem {
  label: string;
  order_count: number;
  total_revenue: number;
}

export interface TopProductItem {
  product_id: number;
  product_title: string;
  sku: string;
  total_quantity: number;
  total_revenue: number;
}

export type SalesDimension =
  | 'branch'
  | 'sale_type'
  | 'payment_method'
  | 'situation'
  | 'state'
  | 'city'
  | 'neighborhood';

export type Granularity = 'day' | 'week' | 'month';
export type TopMetric = 'revenue' | 'quantity';
export type TopLimit = 5 | 10 | 20;

// -------------------------------------------------------
// Products Dashboard
// -------------------------------------------------------
export interface ProductsByCategoryItem {
  category_id: number | null;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
  product_count: number;
}

export interface ProductSearchResult {
  id: number;
  title: string;
  sku: string;
}

export interface ProductDetailData {
  product_info: {
    id: number;
    title: string;
    is_variable: boolean;
    variations: Array<{ id: number; sku: string; cost: number }>;
  };
  sales_over_time: Array<{
    period: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  top_variations: Array<{
    variation_id: number;
    sku: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  current_stock: Array<{
    warehouse_id: number;
    warehouse_name: string;
    total_stock: number;
  }>;
}

// -------------------------------------------------------
// Inventory Dashboard
// -------------------------------------------------------
export interface InventorySummary {
  total_skus: number;
  low_stock_count: number;
  zero_stock_count: number;
  total_units: number;
  warehouses: Array<{
    warehouse_id: number;
    warehouse_name: string;
    total_skus: number;
    total_units: number;
    low_stock: number;
    zero_stock: number;
  }>;
}

export interface LowStockProduct {
  product_variation_id: number;
  product_title: string;
  sku: string;
  warehouse_id: number;
  warehouse_name: string;
  stock: number;
}

export interface PaginatedLowStock {
  page: { page: number; size: number; total: number };
  data: LowStockProduct[];
}

export interface StockRotationItem {
  product_id: number;
  product_title: string;
  variation_id: number;
  sku: string;
  units_sold: number;
  current_stock: number;
  rotation_rate: number | null;
}

export interface StockMovementTypeItem {
  movement_type_id: number;
  type_name: string;
  movement_count: number;
  total_quantity: number;
  avg_quantity: number;
}

// -------------------------------------------------------
// Returns Dashboard
// -------------------------------------------------------
export interface ReturnsKpis {
  total_returns: number;
  total_refund_amount: number;
  avg_refund_amount: number;
  return_rate_pct: number;
}

export interface ReturnsOverTimeItem {
  period: string;
  return_count: number;
  total_refund_amount: number;
}

export interface TopReturnedProduct {
  product_id: number;
  product_title: string;
  return_count: number;
  total_quantity_returned: number;
  total_refund_amount: number;
}

export interface ReturnsByReasonItem {
  reason: string;
  return_type_name: string;
  count: number;
  total_refund_amount: number;
}

// -------------------------------------------------------
// Financial Dashboard
// -------------------------------------------------------
export interface FinancialKpis {
  total_income: number;
  total_expense: number;
  net_cashflow: number;
  transaction_count: number;
  income_count: number;
  expense_count: number;
}

export interface CashflowItem {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinancialByClassItem {
  class_id: number;
  class_name: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface FinancialByPaymentItem {
  payment_method_id: number;
  payment_method_name: string;
  income: number;
  expense: number;
  net: number;
}

export interface AccountBalance {
  account_id: number;
  account_name: string;
  bank: string;
  balance: number;
}

// -------------------------------------------------------
// Customers Dashboard
// -------------------------------------------------------
export type LoyaltyLevel = 'sin_nivel' | 'L1' | 'L2' | 'L3' | 'L4';

export interface LoyaltyDistributionItem {
  level: LoyaltyLevel;
  count: number;
}

export interface CustomersKpis {
  unique_buyers: number;
  with_account: number;
  without_account: number;
  avg_ticket: number;
  total_orders: number;
  loyalty_distribution: LoyaltyDistributionItem[];
}

export interface TopCustomer {
  customer_name: string;
  document_number: string;
  order_count: number;
  total_spent: number;
  avg_ticket: number;
  last_order: string;
  loyalty_level: LoyaltyLevel;
  loyalty_points: number | null;
}

export interface GeoDistributionData {
  by_state: Array<{
    state_id: number;
    state_name: string;
    unique_buyers: number;
    order_count: number;
    total_revenue: number;
  }>;
  by_city: Array<{
    city_id: number;
    city_name: string;
    state_name: string;
    unique_buyers: number;
    order_count: number;
    total_revenue: number;
  }>;
}

export interface CustomersByLoyaltyItem {
  level: LoyaltyLevel;
  customer_count: number;
  avg_spent: number;
  total_points: number;
}

export interface PurchaseFrequencyItem {
  segment: string;
  customer_count: number;
  avg_revenue: number;
}
