// ============================================================
// REPORTS MODULE — TYPE DEFINITIONS
// ============================================================
import { getFirstDayOfMonth, getTodayDate } from "@/shared/utils/date";

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
  neighborhoodId: number | null;
  saleTypeId: number | null;
  paymentMethodId: number | null;
  /**
   * null = el default del backend, que excluye Cancelado y Reembolsado;
   * un array = exactamente esas situaciones.
   */
  situationIds: number[] | null;
  /**
   * Código de la lista de precios (`orders.price_list_code`), no su id: es lo
   * que persiste la orden. `null` = todas las listas.
   */
  priceListCode: string | null;
}

/**
 * Rango por defecto: del día 1 del mes en curso a hoy, en calendario de Lima.
 *
 * Es una factory, no una constante: como constante de módulo se evaluaba una
 * sola vez al importar, así que una pestaña abierta cruzando medianoche o
 * cambio de mes arrastraba un rango obsoleto.
 */
export const createDefaultReportsFilters = (): ReportsFilters => ({
  startDate: getFirstDayOfMonth(),
  endDate: getTodayDate(),
  branchId: null,
  countryId: null,
  stateId: null,
  cityId: null,
  neighborhoodId: null,
  saleTypeId: null,
  paymentMethodId: null,
  situationIds: null,
  priceListCode: null,
});

// -------------------------------------------------------
// Situación de pedido (catálogo global del módulo ORD)
// -------------------------------------------------------
export interface OrderSituationOption {
  id: number;
  name: string;
  code: string | null;
  statuses: { code: string };
}

/**
 * Situaciones que arrancan desmarcadas en el filtro. Mismo criterio que aplica
 * el backend cuando `p_situation_ids` viaja en NULL: estado Cancelado o la
 * situación de reembolso.
 */
export const isDefaultExcludedSituation = (s: OrderSituationOption): boolean =>
  s.statuses.code === 'CAN' || s.code === 'REB-HDN';

/** Ids marcados por defecto: todas las situaciones menos las excluidas. */
export const defaultSituationIds = (options: OrderSituationOption[]): number[] =>
  options.filter((s) => !isDefaultExcludedSituation(s)).map((s) => s.id);

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
  gross_revenue: number;
  total_refunds: number;
  total_revenue: number;
  order_count: number;
  avg_ticket: number;
  total_discount: number;
  total_shipping: number;
  units_sold: number;
  avg_products_per_order: number;
}

export interface SalesOverTimeItem {
  period: string; // ISO date
  order_count: number;
  gross_revenue: number;
  total_refunds: number;
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

export interface ProductsParetoItem {
  product_id: number;
  product_title: string;
  total_quantity: number;
  total_revenue: number;
  revenue_pct: number;
  cumulative_pct: number;
  abc_class: 'A' | 'B' | 'C';
}

export interface SizeByCategoryItem {
  category_id: number | null;
  category_name: string;
  size_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface CategoryOverTimeItem {
  period: string;
  category_id: number | null;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
}

export type ParetoLimit = 10 | 20 | 30;

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
  kpis: {
    total_quantity: number;
    total_revenue: number;
  };
  by_branch: Array<{
    branch_id: number | null;
    branch_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  by_sale_type: Array<{
    sale_type_id: number | null;
    sale_type_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
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

export interface LowStockDistributionItem {
  stock: number;
  skus: number;
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

export interface InventoryValuation {
  price_list_id: number | null;
  cost_value: number;
  retail_value: number;
  potential_margin: number;
  margin_pct: number | null;
  warehouses: Array<{
    warehouse_id: number;
    warehouse_name: string;
    units: number;
    cost_value: number;
    retail_value: number;
  }>;
}

export interface StockByCategoryItem {
  category: string;
  units: number;
  skus: number;
  cost_value: number;
}

export interface StockByTermGroup {
  group_id: number | null;
  groups: Array<{ id: number; code: string; name: string }>;
  data: Array<{ term: string; units: number; skus: number }>;
}

export interface StockFlowItem {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface DeadStockItem {
  product_variation_id: number;
  product_title: string;
  sku: string;
  stock: number;
  cost_value: number;
  last_out_date: string | null;
  days_without_movement: number | null;
}

export interface DeadStockReport {
  summary: { count: number; total_units: number; total_cost_value: number };
  page: { page: number; size: number; total: number };
  data: DeadStockItem[];
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

export interface FinancialProfitKpis {
  units_sold_total: number;
  units_with_known_cost: number;
  cost_coverage_pct: number | null;
  revenue_known_cost: number;
  total_cost: number;
  net_profit: number;
  margin_pct: number | null;
}

export interface MarginByProductItem {
  product_id: number;
  product_title: string;
  units_sold: number;
  units_with_known_cost: number;
  revenue: number | null;
  cost: number | null;
  margin: number | null;
  margin_pct: number | null;
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

export interface NewVsReturningData {
  granularity: 'day' | 'month';
  series: Array<{
    period: string;
    new_customers: number;
    returning_customers: number;
  }>;
}

export type RecencyBucket = 'active' | 'at_risk' | 'inactive' | 'dormant';

export interface CustomersRecencyItem {
  bucket: RecencyBucket;
  customer_count: number;
  total_revenue: number;
}

export interface CustomersParetoItem {
  decile: number;
  customer_count: number;
  revenue: number;
  revenue_pct: number;
  cumulative_pct: number;
}

export interface CustomersBySaleTypeItem {
  sale_type_id: number;
  sale_type_name: string;
  unique_buyers: number;
  order_count: number;
  revenue: number;
}

export interface UpcomingBirthdayItem {
  user_name: string;
  next_birthday: string;
  days_until: number;
  order_count: number;
  total_spent: number;
  last_order: string | null;
  loyalty_level: LoyaltyLevel;
}
