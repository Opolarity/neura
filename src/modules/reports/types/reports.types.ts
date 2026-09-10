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
   * Situaciones de la pestaña Productos. Campo aparte a propósito: su default
   * (solo Enviado y Entregado) no es el de Ventas, y `filters` es compartido
   * entre pestañas — con un único campo la selección de una viajaría a la otra
   * con un significado distinto.
   */
  productSituationIds: number[] | null;
  /**
   * Situación del RETORNO en la pestaña de Cambios/Retornos — catálogo del
   * módulo RTU, no el de pedidos. Campo aparte por la misma razón que
   * `productSituationIds`: `filters` es compartido y esto no significa lo
   * mismo que `situationIds`. `null` = el default del backend (solo Aceptado).
   */
  returnSituationIds: number[] | null;
  /** Tipo de retorno (Devolución total / parcial / Cambio). `null` = todos. */
  returnTypeIds: number[] | null;
  /**
   * Código de la lista de precios (`orders.price_list_code`), no su id: es lo
   * que persiste la orden. `null` = todas las listas.
   */
  priceListCode: string | null;
  /**
   * Cuenta de `movements.business_account_id`. Solo la usa Financiero: es un
   * campo de la caja, no del pedido, así que no aparece en el resto de las
   * pestañas. `null` = todas las cuentas.
   */
  businessAccountId: number | null;
  /**
   * Clase de `movements.movement_class_id` (el "motivo" del movimiento). Igual
   * que la anterior: vive en la caja, no en el pedido. `null` = todas.
   */
  movementClassId: number | null;
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
  productSituationIds: null,
  returnSituationIds: null,
  returnTypeIds: null,
  priceListCode: null,
  businessAccountId: null,
  movementClassId: null,
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

/**
 * Situaciones que Productos cuenta como venta por defecto: la mercadería que
 * efectivamente salió del almacén. Es un criterio DISTINTO al de Ventas —
 * Ventas mide lo que se pidió, Productos lo que salió — y por eso viaja en su
 * propio campo (`productSituationIds`) en vez de compartir `situationIds`.
 */
export const PRODUCTS_DEFAULT_SITUATION_CODES: readonly string[] = ['SEN-PHY', 'FIN-PHY'];

export const isDefaultProductSituation = (s: OrderSituationOption): boolean =>
  s.code !== null && PRODUCTS_DEFAULT_SITUATION_CODES.includes(s.code);

/** Ids marcados por defecto en Productos: solo Enviado y Entregado. */
export const defaultProductSituationIds = (options: OrderSituationOption[]): number[] =>
  options.filter(isDefaultProductSituation).map((s) => s.id);

/** Compara dos listas de ids sin importar el orden. */
export function isSameIdSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

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

export type HeatmapMetric = 'total_revenue' | 'order_count';

/**
 * Fila del mapa de calor. `total_revenue` es el neto (cobros + devoluciones
 * confirmadas), el mismo calculo que los KPIs del reporte.
 */
export interface SalesGeoHeatmapItem {
  state_id?: number;
  city_id?: number;
  geo_map: string | null;
  label: string;
  state_geo_map?: string | null;
  order_count: number;
  gross_revenue?: number;
  total_refunds?: number;
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

/**
 * Totales del periodo contando cada producto UNA vez. No coinciden con la suma
 * de los gráficos por categoría, que atribuyen el producto entero a cada una
 * de sus categorías — ver MultiCategoryNotice.
 */
export interface ProductsKpis {
  total_quantity: number;
  total_revenue: number;
  products_with_sales: number;
  orders_count: number;
  avg_unit_price: number;
}

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
  /**
   * Clave real de la talla: hay dos grupos que se llaman los dos "Talla", así
   * que el nombre del grupo no basta para distinguirlos. `null` en las filas
   * de "Sin talla".
   */
  size_group_id: number | null;
  /** "Talla pantalón", "Talla zapatos"… o "Sin talla". */
  size_group_name: string;
  /** Nombre crudo del término: "M", "32"… o "Sin talla". */
  size_name: string;
  /** Etiqueta lista para el eje: "Talla pantalón · 32" o "Sin talla". */
  size_label: string;
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

/** T-269 · Fila de la bandeja de reposición (sp_rpt_low_stock_products). */
export interface LowStockProductItem {
  product_variation_id: number;
  product_id: number;
  product_title: string;
  sku: string | null;
  /** Total global PRD en almacenes activos (definición única). */
  stock: number;
  warehouse_ids: number[];
}

export interface LowStockProductsReport {
  page: { page: number; size: number; total: number };
  data: LowStockProductItem[];
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
  /**
   * Sale de `return_payments`, no de `returns.total_refund_amount`: el
   * movimiento de caja es el dato firme (el campo del retorno lo pisa
   * `sp_update_return` con lo que manda el front). Viene con el signo
   * invertido, así que un reembolso lee positivo.
   */
  total_refund_amount: number;
  /** Retornos con al menos un movimiento en `return_payments`. */
  refunded_count: number;
  avg_refund_amount: number;
  total_units_returned: number;
  /** Denominador de `return_rate_pct` — pedidos del período sin los cancelados. */
  order_count: number;
  return_rate_pct: number;
}

export interface ReturnsOverTimeItem {
  period: string;
  return_count: number;
  total_refund_amount: number;
  total_units_returned: number;
}

export interface TopReturnedProduct {
  product_id: number;
  product_title: string;
  /** false = el producto ya no está en el catálogo; igual cuenta (migración 31000910163000). */
  product_is_active?: boolean;
  return_count: number;
  total_quantity_returned: number;
  /** Precio unitario por cantidad devuelta. No es lo reembolsado. */
  total_returned_value: number;
}

export interface ReturnsByTypeItem {
  return_type_id: number | null;
  return_type_name: string;
  count: number;
  total_refund_amount: number;
  total_units_returned: number;
}

/** Situación del retorno (catálogo del módulo RTU: Aceptado / Anulado / Pendiente). */
export interface ReturnSituationOption {
  id: number;
  name: string;
  code: string | null;
}

/** Tipo de retorno (Devolución total / parcial / Cambio). */
export interface ReturnTypeOption {
  id: number;
  name: string;
  code: string | null;
}

/**
 * Situación que el backend cuenta cuando `returnSituationIds` viaja en null:
 * solo la aceptada. Mismo criterio que ya aplica Ventas, que netea únicamente
 * los `return_payments` de retornos confirmados.
 */
export const RETURNS_DEFAULT_SITUATION_CODE = 'PHY';

export const defaultReturnSituationIds = (options: ReturnSituationOption[]): number[] =>
  options.filter((s) => s.code === RETURNS_DEFAULT_SITUATION_CODE).map((s) => s.id);

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

/** sp_rpt_financial_by_branch (migración 31000910183000): caja por sucursal. */
export interface FinancialByBranchItem {
  branch_id: number | null;
  branch_name: string;
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

/** Cuenta del negocio, para el filtro "Cuenta" de Financiero. */
export interface BusinessAccountOption {
  id: number;
  name: string;
  bank: string | null;
}

/** Clase (motivo) de movimiento del módulo MOV, para el filtro "Motivo". */
export interface MovementClassOption {
  id: number;
  name: string;
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
  /**
   * Clientes distintos, identificados por DNI/RUC con respaldo en cuenta y
   * nombre — ver vw_rpt_order_customers. Las ventas sin identificar cuentan
   * como un único cliente "Sin identificar".
   */
  unique_buyers: number;
  /** Clientes con al menos un pedido asociado a una cuenta. */
  with_account: number;
  /** El resto. with_account + without_account = unique_buyers. */
  without_account: number;
  avg_ticket: number;
  total_orders: number;
  orders_per_customer: number;
  loyalty_distribution: LoyaltyDistributionItem[];
}

export interface TopCustomer {
  customer_name: string;
  /** null en las ventas de mostrador sin documento cargado. */
  document_number: string | null;
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
