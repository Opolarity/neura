import { supabase } from '@/integrations/supabase/client';
import { buildEndpoint } from '@/shared/utils/utils';
import type {
  ReportsFilters,
  SalesKpis,
  ProductsKpis,
  SalesOverTimeItem,
  SalesByDimensionItem,
  SalesGeoHeatmapItem,
  TopProductItem,
  TopMetric,
  SalesDimension,
  Granularity,
  OrderSituationOption,
  ProductsByCategoryItem,
  ProductSearchResult,
  ProductDetailData,
  ProductsParetoItem,
  ParetoLimit,
  SizeByCategoryItem,
  CategoryOverTimeItem,
  InventorySummary,
  LowStockDistributionItem,
  LowStockProductsReport,
  StockRotationItem,
  StockMovementTypeItem,
  InventoryValuation,
  StockByCategoryItem,
  StockByTermGroup,
  StockFlowItem,
  DeadStockReport,
  ReturnsKpis,
  ReturnsOverTimeItem,
  TopReturnedProduct,
  ReturnsByTypeItem,
  ReturnsByReasonItem,
  ReturnSituationOption,
  ReturnTypeOption,
  FinancialKpis,
  CashflowItem,
  FinancialByClassItem,
  FinancialByPaymentItem,
  BusinessAccountOption,
  MovementClassOption,
  FinancialProfitKpis,
  MarginByProductItem,
  CustomersKpis,
  TopCustomer,
  GeoDistributionData,
  CustomersByLoyaltyItem,
  PurchaseFrequencyItem,
  NewVsReturningData,
  CustomersRecencyItem,
  CustomersParetoItem,
  CustomersBySaleTypeItem,
} from '../types/reports.types';

// -------------------------------------------------------
// Helper: map ReportsFilters to RPC param names
// -------------------------------------------------------
function mapFilters(f: ReportsFilters) {
  return {
    p_start_date: f.startDate ?? undefined,
    p_end_date: f.endDate ?? undefined,
    p_branch_id: f.branchId ?? undefined,
    p_country_id: f.countryId ?? undefined,
    p_state_id: f.stateId ?? undefined,
    p_city_id: f.cityId ?? undefined,
    p_neighborhood_id: f.neighborhoodId ?? undefined,
    p_sale_type_id: f.saleTypeId ?? undefined,
    p_payment_method_id: f.paymentMethodId ?? undefined,
    p_situation_ids: f.situationIds ?? undefined,
    p_price_list_code: f.priceListCode ?? undefined,
  };
}

/**
 * Params comunes de los SP de la pestaña Productos. Sigue siendo distinto de
 * `mapFilters` por una sola razón: la situación viaja en `productSituationIds`
 * y llega ya resuelta desde el hook, así que lo que se envía es literalmente
 * lo que el filtro muestra marcado. El resto del universo de pedidos se acota
 * con los mismos campos que Ventas, todos opcionales.
 *
 * Ojo al agregar params: PostgREST resuelve por el conjunto exacto de
 * argumentos nombrados, así que mandar uno que el SP no declare devuelve
 * PGRST202 (404). Estos existen en los SP de Productos desde la migración
 * 31000908124100.
 */
function mapProductFilters(f: ReportsFilters, situationIds: number[]) {
  return {
    p_start_date: f.startDate ?? undefined,
    p_end_date: f.endDate ?? undefined,
    p_branch_id: f.branchId ?? undefined,
    p_sale_type_id: f.saleTypeId ?? undefined,
    p_country_id: f.countryId ?? undefined,
    p_state_id: f.stateId ?? undefined,
    p_city_id: f.cityId ?? undefined,
    p_neighborhood_id: f.neighborhoodId ?? undefined,
    p_payment_method_id: f.paymentMethodId ?? undefined,
    p_price_list_code: f.priceListCode ?? undefined,
    p_situation_ids: situationIds,
  };
}

async function rpc<T>(fn: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw error;
  return data as T;
}

// ============================================================
// SALES
// ============================================================
export const salesService = {
  getKpis: (f: ReportsFilters) =>
    rpc<SalesKpis>('sp_rpt_sales_kpis', mapFilters(f)),

  getOverTime: (f: ReportsFilters, granularity: Granularity = 'day') =>
    rpc<SalesOverTimeItem[]>('sp_rpt_sales_over_time', {
      ...mapFilters(f),
      p_granularity: granularity,
    }),

  getByDimension: (f: ReportsFilters, dimension: SalesDimension) =>
    rpc<SalesByDimensionItem[]>('sp_rpt_sales_by_dimension', {
      ...mapFilters(f),
      p_dimension: dimension,
    }),

  getGeoHeatmap: (f: ReportsFilters, mapStateId?: number, mapCityId?: number) =>
    rpc<SalesGeoHeatmapItem[]>('sp_rpt_sales_geo_heatmap', {
      ...mapFilters(f),
      p_map_state_id: mapStateId ?? null,
      p_map_city_id: mapCityId ?? null,
    }),

  // Pasa por `mapFilters` como el resto de la pestaña. Antes mandaba solo
  // fecha, sede y situación: los otros siete campos de la barra —canal, método
  // de pago, lista de precios y la cascada geográfica— ni siquiera existían en
  // la firma del SP, así que la tabla se quedaba mostrando el top del período
  // entero mientras el resto de la pantalla sí se acotaba, y sin avisar.
  // Los acepta desde la migración 31000909143000.
  getTopProducts: (f: ReportsFilters, metric: TopMetric = 'revenue', limit = 10) =>
    rpc<TopProductItem[]>('sp_rpt_top_products_sales', {
      ...mapFilters(f),
      p_metric: metric,
      p_limit: limit,
    }),
};

// ============================================================
// PRODUCTS
// ============================================================
export const productsService = {
  // Totales del periodo sin duplicar por categoría — es la cifra que va en las
  // tarjetas, y cuadra con el Pareto y con el Excel, no con los gráficos por
  // categoría.
  getKpis: (f: ReportsFilters, situationIds: number[]) =>
    rpc<ProductsKpis>('sp_rpt_products_kpis', mapProductFilters(f, situationIds)),

  getByCategory: (f: ReportsFilters, situationIds: number[]) =>
    rpc<ProductsByCategoryItem[]>('sp_rpt_products_by_category', mapProductFilters(f, situationIds)),

  getTopByCategory: (
    f: ReportsFilters,
    categoryId: number | null,
    limit = 10,
    situationIds: number[] = [],
  ) =>
    rpc<TopProductItem[]>('sp_rpt_top_products_by_category', {
      ...mapProductFilters(f, situationIds),
      p_category_id: categoryId ?? undefined,
      p_limit: limit,
    }),

  search: (query: string, limit = 10) =>
    rpc<ProductSearchResult[]>('sp_rpt_product_search', {
      p_query: query,
      p_limit: limit,
    }),

  getDetail: (productId: number, f: ReportsFilters, situationIds: number[]) =>
    rpc<ProductDetailData>('sp_rpt_product_detail', {
      ...mapProductFilters(f, situationIds),
      p_product_id: productId,
    }),

  getPareto: (f: ReportsFilters, limit: ParetoLimit = 10, situationIds: number[] = []) =>
    rpc<ProductsParetoItem[]>('sp_rpt_products_pareto', {
      ...mapProductFilters(f, situationIds),
      p_limit: limit,
    }),

  getSalesBySize: (f: ReportsFilters, situationIds: number[]) =>
    rpc<SizeByCategoryItem[]>('sp_rpt_products_sales_by_size', mapProductFilters(f, situationIds)),

  getCategoryOverTime: (
    f: ReportsFilters,
    granularity: Granularity = 'week',
    situationIds: number[] = [],
  ) =>
    rpc<CategoryOverTimeItem[]>('sp_rpt_products_category_over_time', {
      ...mapProductFilters(f, situationIds),
      p_granularity: granularity,
    }),

  // Reutiliza el RPC del tab financiero: devuelve unidades, ingresos y margen
  // por producto — acá alimenta el scatter margen vs volumen.
  //
  // Desde la migración 31000908124100 ese SP acepta los mismos filtros que el
  // resto de Productos, así que ya puede usar mapProductFilters. Financiero lo
  // sigue llamando con su propio subconjunto de params, que continúa siendo
  // válido porque los nuevos tienen DEFAULT.
  getMarginScatter: (f: ReportsFilters, limit = 100, situationIds: number[] = []) =>
    rpc<MarginByProductItem[]>('sp_rpt_financial_margin_by_product', {
      ...mapProductFilters(f, situationIds),
      p_limit: limit,
    }),
};

// ============================================================
// INVENTORY
// ============================================================
export const inventoryService = {
  // T-269: sin `= 10`. Si no se pasa threshold, el SP resuelve el umbral global
  // con fn_low_stock_threshold(); el front ya no inventa ningún valor.
  getSummary: (warehouseId?: number, threshold?: number) =>
    rpc<InventorySummary>('sp_rpt_inventory_summary', {
      p_warehouse_id: warehouseId ?? undefined,
      p_low_stock_threshold: threshold ?? undefined,
    }),

  getLowStockDistribution: (warehouseId?: number, threshold?: number) =>
    rpc<LowStockDistributionItem[]>('sp_rpt_low_stock_distribution', {
      p_warehouse_id: warehouseId ?? undefined,
      p_threshold: threshold ?? undefined,
    }),

  /** T-269 · Bandeja de reposición: SKUs bajo el umbral, paginados. */
  getLowStockProducts: (
    warehouseId?: number,
    threshold?: number,
    page = 1,
    size = 10,
    search?: string,
  ) =>
    rpc<LowStockProductsReport>('sp_rpt_low_stock_products', {
      p_warehouse_id: warehouseId ?? undefined,
      p_threshold: threshold ?? undefined,
      p_page: page,
      p_size: size,
      p_search: search ?? undefined,
    }),

  getRotation: (f: ReportsFilters, warehouseId?: number, limit = 20) =>
    rpc<StockRotationItem[]>('sp_rpt_stock_rotation', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_warehouse_id: warehouseId ?? undefined,
      p_limit: limit,
    }),

  getMovementTypes: (f: ReportsFilters, warehouseId?: number) =>
    rpc<StockMovementTypeItem[]>('sp_rpt_stock_movement_types', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_warehouse_id: warehouseId ?? undefined,
    }),

  // `priceListId` sin definir deja que el SP use su referencia: la lista del
  // canal minorista. Valorizar a mayorista da otro numero, y para un negocio
  // que vende por los dos canales la diferencia importa.
  getValuation: (warehouseId?: number, priceListId?: number) =>
    rpc<InventoryValuation>('sp_rpt_inventory_valuation', {
      p_warehouse_id: warehouseId ?? undefined,
      p_price_list_id: priceListId ?? undefined,
    }),

  getStockByCategory: (warehouseId?: number) =>
    rpc<StockByCategoryItem[]>('sp_rpt_stock_by_category', {
      p_warehouse_id: warehouseId ?? undefined,
    }),

  getStockByTermGroup: (termGroupId?: number, warehouseId?: number) =>
    rpc<StockByTermGroup>('sp_rpt_stock_by_term_group', {
      p_term_group_id: termGroupId ?? undefined,
      p_warehouse_id: warehouseId ?? undefined,
    }),

  getStockFlow: (f: ReportsFilters, granularity: Granularity = 'day', warehouseId?: number) =>
    rpc<StockFlowItem[]>('sp_rpt_stock_flow_over_time', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_granularity: granularity,
      p_warehouse_id: warehouseId ?? undefined,
    }),

  getDeadStock: (days: number, warehouseId?: number, page = 1, size = 10) =>
    rpc<DeadStockReport>('sp_rpt_dead_stock', {
      p_days: days,
      p_warehouse_id: warehouseId ?? undefined,
      p_page: page,
      p_size: size,
    }),
};

// ============================================================
// RETURNS
// ============================================================
/**
 * Params comunes de los SP de Cambios/Retornos. El universo de pedidos se
 * acota con los mismos campos que Ventas — el retorno cuelga de un pedido —
 * más los dos propios de la pestaña: la situación del retorno (catálogo del
 * módulo RTU, no el de pedidos) y el tipo.
 *
 * Ojo al agregar params: PostgREST resuelve por el conjunto exacto de
 * argumentos nombrados, así que mandar uno que el SP no declare devuelve
 * PGRST202 (404). Estos existen desde la migración 31000908232000.
 */
function mapReturnFilters(f: ReportsFilters) {
  return {
    p_start_date: f.startDate ?? undefined,
    p_end_date: f.endDate ?? undefined,
    p_branch_id: f.branchId ?? undefined,
    p_return_situation_ids: f.returnSituationIds ?? undefined,
    p_return_type_ids: f.returnTypeIds ?? undefined,
    p_sale_type_id: f.saleTypeId ?? undefined,
    p_payment_method_id: f.paymentMethodId ?? undefined,
    p_price_list_code: f.priceListCode ?? undefined,
    p_country_id: f.countryId ?? undefined,
    p_state_id: f.stateId ?? undefined,
    p_city_id: f.cityId ?? undefined,
    p_neighborhood_id: f.neighborhoodId ?? undefined,
  };
}

export const returnsService = {
  getKpis: (f: ReportsFilters) =>
    rpc<ReturnsKpis>('sp_rpt_returns_kpis', mapReturnFilters(f)),

  getOverTime: (f: ReportsFilters, granularity: Granularity = 'day') =>
    rpc<ReturnsOverTimeItem[]>('sp_rpt_returns_over_time', {
      ...mapReturnFilters(f),
      p_granularity: granularity,
    }),

  getTopProducts: (f: ReportsFilters, limit = 10) =>
    rpc<TopReturnedProduct[]>('sp_rpt_top_returned_products', {
      ...mapReturnFilters(f),
      p_limit: limit,
    }),

  getByType: (f: ReportsFilters) =>
    rpc<ReturnsByTypeItem[]>('sp_rpt_returns_by_type', mapReturnFilters(f)),

  getByReason: (f: ReportsFilters) =>
    rpc<ReturnsByReasonItem[]>('sp_rpt_returns_by_reason', mapReturnFilters(f)),
};

/** Una fila por retorno — mismo grano y mismos filtros que las tarjetas. */
export interface ReturnsExportRow {
  return_id: number;
  return_date: string;
  order_id: number;
  order_date: string | null;
  customer_name: string;
  customer_document: string;
  return_type_name: string;
  situation_name: string;
  reason: string;
  branch_name: string;
  sale_type_name: string;
  products: string;
  units_returned: number;
  returned_value: number;
  refunded_amount: number;
}

export const fetchReturnsReport = (f: ReportsFilters): Promise<ReturnsExportRow[]> =>
  rpc<ReturnsExportRow[]>('sp_rpt_export_returns', mapReturnFilters(f));

// ============================================================
// FINANCIAL
// ============================================================
/**
 * Params de la mitad de CAJA de Financiero: los cuatro SP que leen `movements`.
 * Ahí no hay pedido, así que canal, geografía y lista de precios no existen —
 * lo único que acota un movimiento es sede, cuenta, método de pago y motivo.
 */
function mapCashFilters(f: ReportsFilters) {
  return {
    p_start_date: f.startDate ?? undefined,
    p_end_date: f.endDate ?? undefined,
    p_branch_id: f.branchId ?? undefined,
    p_business_account: f.businessAccountId ?? undefined,
    p_payment_method_id: f.paymentMethodId ?? undefined,
    p_movement_class_id: f.movementClassId ?? undefined,
  };
}

export const financialService = {
  getKpis: (f: ReportsFilters) =>
    rpc<FinancialKpis>('sp_rpt_financial_kpis', mapCashFilters(f)),

  getCashflowOverTime: (f: ReportsFilters, granularity: Granularity = 'day') =>
    rpc<CashflowItem[]>('sp_rpt_cashflow_over_time', {
      ...mapCashFilters(f),
      p_granularity: granularity,
    }),

  getByClass: (f: ReportsFilters) =>
    rpc<FinancialByClassItem[]>('sp_rpt_financial_by_class', mapCashFilters(f)),

  getByPaymentMethod: (f: ReportsFilters) =>
    rpc<FinancialByPaymentItem[]>('sp_rpt_financial_by_payment_method', mapCashFilters(f)),

  // La mitad de PEDIDOS. `situationIds` viaja siempre como array explícito —
  // nunca undefined — porque sp_rpt_financial_margin_by_product interpreta el
  // NULL como "sin filtro", no como el default de Ventas. Mandarles el mismo
  // array a las dos es lo que hace que las tarjetas cierren con la tabla.
  getProfitKpis: (f: ReportsFilters, situationIds: number[]) =>
    rpc<FinancialProfitKpis>('sp_rpt_financial_profit_kpis', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_situation_ids: situationIds,
      p_payment_method_id: f.paymentMethodId ?? undefined,
    }),

  getMarginByProduct: (f: ReportsFilters, situationIds: number[], limit = 20) =>
    rpc<MarginByProductItem[]>('sp_rpt_financial_margin_by_product', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_limit: limit,
      p_situation_ids: situationIds,
      p_payment_method_id: f.paymentMethodId ?? undefined,
    }),
};

// Una fila por movimiento de caja, para la hoja "Movimientos" del Excel de
// /reports/movements. Mismos filtros que la pantalla.
export interface FinancialMovementExportRow {
  movement_id: number;
  movement_date: string;
  code: string | null;
  /**
   * Ingreso/Egreso según el SIGNO del monto, que es como clasifican las
   * tarjetas y los dos gráficos. Por eso las columnas de la hoja suman igual
   * que los KPI.
   */
  direction: string;
  /**
   * El tipo tal como quedó registrado en el ERP. No siempre coincide con
   * `direction`: los movimientos anteriores al fix de signo de julio de 2026
   * quedaron con el tipo "Egreso" y monto positivo.
   */
  registered_type: string | null;
  class_name: string;
  description: string | null;
  payment_method: string | null;
  business_account: string | null;
  branch: string | null;
  user_name: string | null;
  amount: number;
  income: number;
  expense: number;
}

export const fetchFinancialMovementsReport = (
  f: ReportsFilters,
): Promise<FinancialMovementExportRow[]> =>
  rpc<FinancialMovementExportRow[]>('sp_rpt_export_financial_movements', mapCashFilters(f));

// ============================================================
// CUSTOMERS
// ============================================================
/**
 * Params comunes de los SP de la pestaña Clientes. `situationIds` en NULL deja
 * que el backend aplique su default, que es el mismo de Ventas: todo menos
 * cancelado y reembolsado.
 *
 * Desde la migración 31000908161000 los nueve SP aceptan el mismo juego que
 * Ventas, así que ya no hace falta una excepción para el de geografía.
 */
function mapCustomerFilters(f: ReportsFilters) {
  return {
    p_start_date: f.startDate ?? undefined,
    p_end_date: f.endDate ?? undefined,
    p_branch_id: f.branchId ?? undefined,
    p_sale_type_id: f.saleTypeId ?? undefined,
    p_country_id: f.countryId ?? undefined,
    p_state_id: f.stateId ?? undefined,
    p_city_id: f.cityId ?? undefined,
    p_neighborhood_id: f.neighborhoodId ?? undefined,
    p_payment_method_id: f.paymentMethodId ?? undefined,
    p_price_list_code: f.priceListCode ?? undefined,
    p_situation_ids: f.situationIds ?? undefined,
  };
}

export const customersService = {
  getKpis: (f: ReportsFilters) =>
    rpc<CustomersKpis>('sp_rpt_customers_kpis', mapCustomerFilters(f)),

  getTopCustomers: (f: ReportsFilters, limit = 10) =>
    rpc<TopCustomer[]>('sp_rpt_top_customers', {
      ...mapCustomerFilters(f),
      p_limit: limit,
    }),

  getGeoDistribution: (f: ReportsFilters) =>
    rpc<GeoDistributionData>('sp_rpt_customers_geo_distribution', mapCustomerFilters(f)),

  getByLoyalty: (f: ReportsFilters) =>
    rpc<CustomersByLoyaltyItem[]>('sp_rpt_customers_by_loyalty', mapCustomerFilters(f)),

  getPurchaseFrequency: (f: ReportsFilters) =>
    rpc<PurchaseFrequencyItem[]>('sp_rpt_customers_purchase_frequency', mapCustomerFilters(f)),

  getNewVsReturning: (f: ReportsFilters) =>
    rpc<NewVsReturningData>('sp_rpt_customers_new_vs_returning', mapCustomerFilters(f)),

  getRecency: (f: ReportsFilters) =>
    rpc<CustomersRecencyItem[]>('sp_rpt_customers_recency', mapCustomerFilters(f)),

  getPareto: (f: ReportsFilters) =>
    rpc<CustomersParetoItem[]>('sp_rpt_customers_pareto', mapCustomerFilters(f)),

  getBySaleType: (f: ReportsFilters) =>
    rpc<CustomersBySaleTypeItem[]>('sp_rpt_customers_by_sale_type', mapCustomerFilters(f)),

};

// ============================================================
// SALES REPORT EXPORT
// ============================================================
export interface SalesReportRow {
  order_id: number;
  order_date: string;
  shipping_method: string | null;
  document_type: string | null;
  document_number: string;
  customer_name: string;
  sale_type: string | null;
  seller: string | null;
  total: number;
  // Cobrado NETO de devoluciones confirmadas, para que la hoja cierre con la
  // tarjeta "Ventas Totales" del dashboard.
  paid_amount: number;
  // Reembolsos confirmados de la orden. Vienen en negativo, así que
  // paid_amount = (pagos) + refund_amount.
  refund_amount: number;
  // Métodos de pago de la orden, ya formateados por el SP como
  // "Efectivo (50.00), Yape (30.00)". "-" cuando la orden no tiene pagos.
  payment_methods: string | null;
  invoice: string | null;
  situation: string | null;
  district: string | null;
  province: string | null;
  department: string | null;
  branch: string | null;
  warehouse: string | null;
  price_list: string | null;
  products: string;
}

// Una fila por ITEM vendido, para la hoja "Ventas Detalle". Misma población y
// mismos filtros que fetchSalesReport, así que las dos hojas del Excel miden
// sobre el mismo conjunto de órdenes.
export interface SalesDetailReportRow {
  order_product_id: number;
  order_id: number;
  order_date: string;
  customer_name: string;
  sale_type: string | null;
  seller: string | null;
  situation: string | null;
  branch: string | null;
  invoice: string | null;
  product_title: string | null;
  sku: string | null;
  variation: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  categories: string | null;
  brand: string | null;
  tags: string | null;
  // Costo de la línea al momento de la venta (order_products.unit_cost); si esa
  // línea no lo tiene, cae al costo vigente de la variación. Va NULL cuando no
  // hay ninguno de los dos, y entonces line_cost/line_margin/margin_pct también.
  unit_cost: number | null;
  line_cost: number | null;
  line_margin: number | null;
  margin_pct: number | null;
  warehouse: string | null;
}

// Misma población y mismos filtros que los KPIs del dashboard. Las fechas salen
// de `filters` como el resto: el Excel exporta exactamente lo que el usuario
// tiene aplicado en la barra de filtros de /reports/sales.
export const fetchSalesReport = (f: ReportsFilters): Promise<SalesReportRow[]> =>
  rpc<SalesReportRow[]>('sp_rpt_export_sales', mapFilters(f));

export const fetchSalesDetailReport = (
  f: ReportsFilters,
): Promise<SalesDetailReportRow[]> =>
  rpc<SalesDetailReportRow[]>('sp_rpt_export_sales_detail', mapFilters(f));

// Una fila por CLIENTE, para el Excel de /reports/clients. Misma identidad y
// mismos filtros que la pantalla, pero sin límite: "Top clientes" corta en el
// límite elegido, esto trae todos.
export interface CustomerExportRow {
  customer_name: string;
  document_number: string | null;
  has_account: boolean;
  /** true para la fila de las ventas sin cliente identificable. */
  is_anonymous: boolean;
  order_count: number;
  total_spent: number;
  avg_ticket: number;
  first_order: string;
  last_order: string;
  loyalty_level: string;
  loyalty_points: number | null;
}

export const fetchCustomersReport = (f: ReportsFilters): Promise<CustomerExportRow[]> =>
  rpc<CustomerExportRow[]>('sp_rpt_export_customers', mapCustomerFilters(f));

// Una fila por variación y ALMACÉN, que es el grano del stock: para un conteo
// físico importa dónde está cada unidad. No recibe el rango de fechas porque el
// stock es una foto del presente.
export interface InventoryExportRow {
  sku: string;
  product_title: string;
  warehouse_name: string;
  /** Stock en ese almacén. */
  stock: number;
  /** Stock del SKU sumando almacenes: es contra esto que se decide el stock bajo. */
  stock_sku_total: number;
  /** null cuando el umbral global no está configurado. */
  is_low_stock: boolean | null;
  unit_cost: number;
  cost_value: number;
  unit_price: number;
  retail_value: number;
  last_movement: string | null;
}

export const fetchInventoryReport = (
  warehouseId?: number,
  threshold?: number,
  priceListId?: number,
): Promise<InventoryExportRow[]> =>
  rpc<InventoryExportRow[]>('sp_rpt_export_inventory', {
    p_warehouse_id: warehouseId ?? undefined,
    p_threshold: threshold ?? undefined,
    p_price_list_id: priceListId ?? undefined,
  });

// ============================================================
// SHARED: Load filter options
// ============================================================
export const filterOptionsService = {
  // El catálogo de situaciones no tiene columna de orden propia, así que se
  // ordena por id: en la práctica los ids siguen el avance del pedido.
  getOrderSituations: async (): Promise<OrderSituationOption[]> => {
    const { data, error } = await supabase
      .from('situations')
      .select('id, name, code, modules!inner(code), statuses!inner(code)')
      .eq('modules.code', 'ORD')
      .order('id');
    if (error) throw error;
    return (data ?? []) as unknown as OrderSituationOption[];
  },

  /**
   * Situaciones del RETORNO — módulo RTU, no ORD: Aceptado, Anulado y
   * Pendiente. Es otro catálogo, no un subconjunto del de pedidos.
   */
  getReturnSituations: async (): Promise<ReturnSituationOption[]> => {
    const { data, error } = await supabase
      .from('situations')
      .select('id, name, code, modules!inner(code)')
      .eq('modules.code', 'RTU')
      .order('id');
    if (error) throw error;
    return (data ?? []) as unknown as ReturnSituationOption[];
  },

  /** Tipos de retorno: Devolución total, Devolución parcial y Cambio. */
  getReturnTypes: async (): Promise<ReturnTypeOption[]> => {
    const { data, error } = await supabase
      .from('types')
      .select('id, name, code, modules!inner(code)')
      .eq('modules.code', 'RTU')
      .eq('is_active', true)
      .order('id');
    if (error) throw error;
    return (data ?? []) as unknown as ReturnTypeOption[];
  },

  getBranches: async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  // Cuentas del negocio, para el filtro de Financiero. Solo las activas: las
  // dadas de baja siguen teniendo movimientos históricos, pero no son algo
  // sobre lo que hoy se quiera reportar.
  getBusinessAccounts: async (): Promise<BusinessAccountOption[]> => {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('id, name, bank')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data ?? []) as BusinessAccountOption[];
  },

  // Motivos de movimiento del módulo MOV. Es el mismo catálogo que ofrece el
  // alta de movimientos del ERP, así que el filtro del reporte y el formulario
  // hablan de lo mismo.
  getMovementClasses: async (): Promise<MovementClassOption[]> => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, modules!inner(code)')
      .eq('modules.code', 'MOV')
      .order('name');
    if (error) throw error;
    return (data ?? []) as unknown as MovementClassOption[];
  },

  getCountries: async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('id, name')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  getStates: async (countryId: number) => {
    const { data, error } = await supabase
      .from('states')
      .select('id, name')
      .eq('country_id', countryId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  getCities: async (stateId: number) => {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name')
      .eq('state_id', stateId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  getNeighborhoods: async (cityId: number) => {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('id, name')
      .eq('city_id', cityId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  getSaleTypes: async () => {
    const { data, error } = await supabase
      .from('sale_types')
      .select('id, name')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  // Solo listas activas y con código: el filtro compara contra
  // orders.price_list_code, así que una lista sin código no es seleccionable.
  getPriceLists: async () => {
    const { data, error } = await supabase
      .from('price_list')
      .select('id, name, code')
      .eq('is_active', true)
      .not('code', 'is', null)
      .neq('code', '')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  getPaymentMethods: async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },
};

// -------------------------------------------------------
// Price Rules Report
// -------------------------------------------------------
export interface PriceRuleKpis {
  /** Reglas que existen hoy y están activas. No depende del rango. */
  active: number;
  /** Reglas que existen hoy y están apagadas. No depende del rango. */
  inactive: number;
  /** Reglas con al menos una aplicación en el rango y con los filtros aplicados. */
  used: number;
  /** Aplicaciones atribuidas a una regla en el rango. */
  applications: number;
  /**
   * Venta de los pedidos que tuvieron al menos una regla. Un pedido con dos
   * reglas se cuenta una sola vez acá, aunque su venta aparezca en la fila de
   * cada una de las dos.
   */
  revenue: number;
}

export interface PriceRuleReportRow {
  id: number;
  name: string;
  code: string | null;
  rule_type: 'automatic' | 'coupon';
  is_active: boolean;
  // Regla eliminada del ERP (price_rules.deleted_at). El SP ya la excluye de los
  // KPIs, pero la sigue listando si tuvo aplicaciones en el rango, para no
  // perder el historial de ventas. Por eso la fila necesita distinguirse: una
  // eliminada llega con is_active = false y sin este campo se contaría como
  // "inactiva" en la pestaña, contradiciendo al KPI.
  is_deleted: boolean;
  /** Vigencia configurada en la regla. null = sin límite por ese lado. */
  valid_from: string | null;
  valid_to: string | null;
  applications: number;
  /** Pedidos distintos donde aplicó. Difiere de `applications` si aplicó dos veces al mismo pedido. */
  orders: number;
  /** Venta de esos pedidos (orders.total). No es el monto descontado: ver la nota al pie de la pestaña. */
  revenue: number;
  /** Participación sobre `kpis.applications`. La columna suma 100. */
  share: number;
}

/**
 * Descuentos del período que NO vienen de una regla de precios: los códigos que
 * escribe el sistema (CUSTOM = descuento manual del POS, PRO = descuento por
 * producto, MERCP_SURCHARGE = recargo de Mercado Pago) y los códigos cuya regla
 * ya no existe. Van en una fila aparte para que el total de la pantalla cuadre
 * con todos los descuentos del período, sin ensuciar el conteo de reglas.
 */
export interface PriceRulesOther {
  applications: number;
  orders: number;
  revenue: number;
  codes: string[];
}

export interface PriceRulesReport {
  kpis: PriceRuleKpis;
  table: PriceRuleReportRow[];
  other: PriceRulesOther;
}

export const priceRulesReportService = {
  getReport: (f: ReportsFilters) =>
    rpc<PriceRulesReport>('sp_rpt_price_rules_report', mapCustomerFilters(f)),
};
