import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/reports.service';
import type { ReportsFilters, Granularity, SalesDimension, TopMetric, TopLimit } from '../types/reports.types';

export function useSalesDashboard(filters: ReportsFilters) {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [dimension, setDimension] = useState<SalesDimension>('branch');
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

  const byDimension = useQuery({
    queryKey: ['rpt_sales_by_dimension', ...queryKey, dimension],
    queryFn: () => salesService.getByDimension(filters, dimension),
    staleTime: 1000 * 60 * 5,
  });

  const topProducts = useQuery({
    queryKey: ['rpt_top_products_sales', ...queryKey, topMetric, topLimit],
    queryFn: () => salesService.getTopProducts(filters, topMetric, topLimit),
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpis,
    overTime,
    byDimension,
    topProducts,
    granularity,
    setGranularity,
    dimension,
    setDimension,
    topMetric,
    setTopMetric,
    topLimit,
    setTopLimit,
  };
}
