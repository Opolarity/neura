import { supabase } from '@/integrations/supabase/client';
import { buildEndpoint } from '@/shared/utils/utils';
import type {
  ReportsFilters,
  SalesKpis,
  SalesOverTimeItem,
  SalesByDimensionItem,
  SalesGeoHeatmapItem,
  TopProductItem,
  SalesDimension,
  Granularity,
  ProductsByCategoryItem,
  ProductSearchResult,
  ProductDetailData,
  ProductsParetoItem,
  ParetoLimit,
  SizeByCategoryItem,
  CategoryOverTimeItem,
  InventorySummary,
  PaginatedLowStock,
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
  ReturnsByReasonItem,
  FinancialKpis,
  CashflowItem,
  FinancialByClassItem,
  FinancialByPaymentItem,
  AccountBalance,
  FinancialProfitKpis,
  MarginByProductItem,
  CustomersKpis,
  TopCustomer,
  GeoDistributionData,
  CustomersByLoyaltyItem,
  PurchaseFrequencyItem,
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
export interface SalesExtraFilters {
  productId?: number | null;
  /** Solo para mostrar en el combobox — no se manda al backend. */
  productTitle?: string;
  minTotal?: number | null;
  maxTotal?: number | null;
}

function mapSalesExtraFilters(extra?: SalesExtraFilters) {
  return {
    p_product_id: extra?.productId ?? undefined,
    p_min_total: extra?.minTotal ?? undefined,
    p_max_total: extra?.maxTotal ?? undefined,
  };
}

export const salesService = {
  getKpis: (f: ReportsFilters, extra?: SalesExtraFilters) =>
    rpc<SalesKpis>('sp_rpt_sales_kpis', { ...mapFilters(f), ...mapSalesExtraFilters(extra) }),

  getOverTime: (f: ReportsFilters, granularity: Granularity = 'day', extra?: SalesExtraFilters) =>
    rpc<SalesOverTimeItem[]>('sp_rpt_sales_over_time', {
      ...mapFilters(f),
      p_granularity: granularity,
      ...mapSalesExtraFilters(extra),
    }),

  getByDimension: (f: ReportsFilters, dimension: SalesDimension, extra?: SalesExtraFilters) =>
    rpc<SalesByDimensionItem[]>('sp_rpt_sales_by_dimension', {
      ...mapFilters(f),
      p_dimension: dimension,
      ...mapSalesExtraFilters(extra),
    }),

  getGeoHeatmap: (f: ReportsFilters, mapStateId?: number, mapCityId?: number) =>
    rpc<SalesGeoHeatmapItem[]>('sp_rpt_sales_geo_heatmap', {
      ...mapFilters(f),
      p_map_state_id: mapStateId ?? null,
      p_map_city_id:  mapCityId  ?? null,
    }),
};

// ============================================================
// PRODUCTS
// ============================================================
export const productsService = {
  getByCategory: (f: ReportsFilters) =>
    rpc<ProductsByCategoryItem[]>('sp_rpt_products_by_category', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_sale_type_id: f.saleTypeId ?? undefined,
    }),

  getTopByCategory: (f: ReportsFilters, categoryId: number | null, limit = 10) =>
    rpc<TopProductItem[]>('sp_rpt_top_products_by_category', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_category_id: categoryId ?? undefined,
      p_limit: limit,
      p_sale_type_id: f.saleTypeId ?? undefined,
    }),

  search: (query: string, limit = 10) =>
    rpc<ProductSearchResult[]>('sp_rpt_product_search', {
      p_query: query,
      p_limit: limit,
    }),

  getDetail: (productId: number, f: ReportsFilters) =>
    rpc<ProductDetailData>('sp_rpt_product_detail', {
      p_product_id: productId,
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_sale_type_id: f.saleTypeId ?? undefined,
    }),

  getPareto: (f: ReportsFilters, limit: ParetoLimit = 20) =>
    rpc<ProductsParetoItem[]>('sp_rpt_products_pareto', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_sale_type_id: f.saleTypeId ?? undefined,
      p_limit: limit,
    }),

  getSalesBySize: (f: ReportsFilters) =>
    rpc<SizeByCategoryItem[]>('sp_rpt_products_sales_by_size', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_sale_type_id: f.saleTypeId ?? undefined,
    }),

  getCategoryOverTime: (f: ReportsFilters, granularity: Granularity = 'week') =>
    rpc<CategoryOverTimeItem[]>('sp_rpt_products_category_over_time', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_granularity: granularity,
      p_branch_id: f.branchId ?? undefined,
      p_sale_type_id: f.saleTypeId ?? undefined,
    }),

  // Reutiliza el RPC del tab financiero: devuelve unidades, ingresos y margen
  // por producto — acá alimenta el scatter margen vs volumen.
  getMarginScatter: (f: ReportsFilters, limit = 100) =>
    rpc<MarginByProductItem[]>('sp_rpt_financial_margin_by_product', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_limit: limit,
    }),
};

// ============================================================
// INVENTORY
// ============================================================
export const inventoryService = {
  getSummary: (warehouseId?: number, threshold = 10) =>
    rpc<InventorySummary>('sp_rpt_inventory_summary', {
      p_warehouse_id: warehouseId ?? undefined,
      p_low_stock_threshold: threshold,
    }),

  getLowStock: (warehouseId?: number, threshold = 10, page = 1, size = 20) =>
    rpc<PaginatedLowStock>('sp_rpt_low_stock_products', {
      p_warehouse_id: warehouseId ?? undefined,
      p_threshold: threshold,
      p_page: page,
      p_size: size,
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

  getValuation: (warehouseId?: number) =>
    rpc<InventoryValuation>('sp_rpt_inventory_valuation', {
      p_warehouse_id: warehouseId ?? undefined,
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
export const returnsService = {
  getKpis: (f: ReportsFilters) =>
    rpc<ReturnsKpis>('sp_rpt_returns_kpis', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
    }),

  getOverTime: (f: ReportsFilters, granularity: Granularity = 'day') =>
    rpc<ReturnsOverTimeItem[]>('sp_rpt_returns_over_time', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_granularity: granularity,
      p_branch_id: f.branchId ?? undefined,
    }),

  getTopProducts: (f: ReportsFilters, limit = 10) =>
    rpc<TopReturnedProduct[]>('sp_rpt_top_returned_products', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_limit: limit,
    }),

  getByReason: (f: ReportsFilters) =>
    rpc<ReturnsByReasonItem[]>('sp_rpt_returns_by_reason', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
    }),
};

// ============================================================
// FINANCIAL
// ============================================================
export const financialService = {
  getKpis: (f: ReportsFilters) =>
    rpc<FinancialKpis>('sp_rpt_financial_kpis', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
    }),

  getCashflowOverTime: (f: ReportsFilters, granularity: Granularity = 'day') =>
    rpc<CashflowItem[]>('sp_rpt_cashflow_over_time', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_granularity: granularity,
      p_branch_id: f.branchId ?? undefined,
    }),

  getByClass: (f: ReportsFilters) =>
    rpc<FinancialByClassItem[]>('sp_rpt_financial_by_class', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
    }),

  getByPaymentMethod: (f: ReportsFilters) =>
    rpc<FinancialByPaymentItem[]>('sp_rpt_financial_by_payment_method', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
    }),

  getAccountBalances: () =>
    rpc<AccountBalance[]>('sp_rpt_financial_accounts_balances'),

  getProfitKpis: (f: ReportsFilters) =>
    rpc<FinancialProfitKpis>('sp_rpt_financial_profit_kpis', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
    }),

  getMarginByProduct: (f: ReportsFilters, limit = 20) =>
    rpc<MarginByProductItem[]>('sp_rpt_financial_margin_by_product', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_limit: limit,
    }),
};

// ============================================================
// CUSTOMERS
// ============================================================
export const customersService = {
  getKpis: (f: ReportsFilters) =>
    rpc<CustomersKpis>('sp_rpt_customers_kpis', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
    }),

  getTopCustomers: (f: ReportsFilters, limit = 10) =>
    rpc<TopCustomer[]>('sp_rpt_top_customers', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_limit: limit,
    }),

  getGeoDistribution: (f: ReportsFilters) =>
    rpc<GeoDistributionData>('sp_rpt_customers_geo_distribution', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_country_id: f.countryId ?? undefined,
    }),

  getByLoyalty: () =>
    rpc<CustomersByLoyaltyItem[]>('sp_rpt_customers_by_loyalty'),

  getPurchaseFrequency: (f: ReportsFilters) =>
    rpc<PurchaseFrequencyItem[]>('sp_rpt_customers_purchase_frequency', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
    }),
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

export const fetchSalesReport = async (
  startDate: string,
  endDate: string,
  filters?: ReportsFilters,
  extra?: SalesExtraFilters,
): Promise<SalesReportRow[]> => {
  const endpoint = buildEndpoint('get-sales-report', {
    start_date: startDate,
    end_date: endDate,
    branch_id: filters?.branchId ?? undefined,
    sale_type_id: filters?.saleTypeId ?? undefined,
    payment_method_id: filters?.paymentMethodId ?? undefined,
    country_id: filters?.countryId ?? undefined,
    state_id: filters?.stateId ?? undefined,
    city_id: filters?.cityId ?? undefined,
    neighborhood_id: filters?.neighborhoodId ?? undefined,
    product_id: extra?.productId ?? undefined,
    min_total: extra?.minTotal ?? undefined,
    max_total: extra?.maxTotal ?? undefined,
  });
  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: 'GET',
  });
  if (error) throw error;
  return data;
};

// ============================================================
// SHARED: Refresh materialized views (called from UI)
// ============================================================
export const refreshReportMviews = () =>
  supabase.rpc('fn_refresh_report_mviews');

// ============================================================
// SHARED: Load filter options
// ============================================================
export const filterOptionsService = {
  getBranches: async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data ?? [];
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
  active: number;
  inactive: number;
  automatic: number;
  coupon: number;
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
  applications: number;
  rendimiento: number;
}

export interface PriceRulesReport {
  kpis: PriceRuleKpis;
  table: PriceRuleReportRow[];
}

export const priceRulesReportService = {
  getReport: (startDate: string | null, endDate: string | null) =>
    rpc<PriceRulesReport>('sp_rpt_price_rules_report', {
      p_start_date: startDate ?? undefined,
      p_end_date: endDate ?? undefined,
    }),
};
