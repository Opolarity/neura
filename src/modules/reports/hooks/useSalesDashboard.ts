import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/reports.service';
import type { ReportsFilters, Granularity, SalesDimension, TopMetric, TopLimit } from '../types/reports.types';

const ALL_DIMENSIONS: SalesDimension[] = [
  'branch', 'sale_type', 'payment_method', 'situation', 'state', 'city', 'neighborhood',
];

export function useSalesDashboard(filters: ReportsFilters) {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [topMetric, setTopMetric] = useState<TopMetric>('revenue');
  const [topLimit, setTopLimit] = useState<TopLimit>(10);

  const queryKey = [filters];

  const kpis = useQuery({
    queryKey: ['rpt_sales_kpis', ...queryKey],
    queryFn: () => salesService.getKpis(filters),
    staleTime: 1000 * 60 * 5,
  });

  const overTime = useQuery({
    queryKey: ['rpt_sales_over_time', ...queryKey, granularity],
    queryFn: () => salesService.getOverTime(filters, granularity),
    staleTime: 1000 * 60 * 5,
  });

  // Una query por cada dimensión, todas en paralelo
  const byDimensionQueries = Object.fromEntries(
    ALL_DIMENSIONS.map((dim) => [
      dim,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useQuery({
        queryKey: ['rpt_sales_by_dimension', ...queryKey, dim],
        queryFn: () => salesService.getByDimension(filters, dim),
        staleTime: 1000 * 60 * 5,
      }),
    ]),
  ) as Record<SalesDimension, ReturnType<typeof useQuery>>;

  const topProducts = useQuery({
    queryKey: ['rpt_top_products_sales', ...queryKey, topMetric, topLimit],
    queryFn: () => salesService.getTopProducts(filters, topMetric, topLimit),
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpis,
    overTime,
    byDimensionQueries,
    topProducts,
    granularity,
    setGranularity,
    topMetric,
    setTopMetric,
    topLimit,
    setTopLimit,
  };
}
