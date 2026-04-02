import { supabase } from '@/integrations/supabase/client';
import { buildEndpoint } from '@/shared/utils/utils';
import type {
  ReportsFilters,
  SalesKpis,
  SalesOverTimeItem,
  SalesByDimensionItem,
  TopProductItem,
  SalesDimension,
  Granularity,
  TopMetric,
  ProductsByCategoryItem,
  ProductSearchResult,
  ProductDetailData,
  InventorySummary,
  PaginatedLowStock,
  StockRotationItem,
  StockMovementTypeItem,
  ReturnsKpis,
  ReturnsOverTimeItem,
  TopReturnedProduct,
  ReturnsByReasonItem,
  FinancialKpis,
  CashflowItem,
  FinancialByClassItem,
  FinancialByPaymentItem,
  AccountBalance,
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

  getTopProducts: (f: ReportsFilters, metric: TopMetric = 'revenue', limit = 10) =>
    rpc<TopProductItem[]>('sp_rpt_top_products_sales', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_metric: metric,
      p_limit: limit,
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
    }),

  getTopByCategory: (f: ReportsFilters, categoryId: number | null, limit = 10) =>
    rpc<TopProductItem[]>('sp_rpt_top_products_by_category', {
      p_start_date: f.startDate ?? undefined,
      p_end_date: f.endDate ?? undefined,
      p_branch_id: f.branchId ?? undefined,
      p_category_id: categoryId ?? undefined,
      p_limit: limit,
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
  products: string;
}

export const fetchSalesReport = async (
  startDate: string,
  endDate: string
): Promise<SalesReportRow[]> => {
  const endpoint = buildEndpoint('get-sales-report', {
    start_date: startDate,
    end_date: endDate,
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
