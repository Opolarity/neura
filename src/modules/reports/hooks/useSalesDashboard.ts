import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/reports.service';
import type { SalesExtraFilters } from '../services/reports.service';
import type { ReportsFilters, Granularity, SalesDimension } from '../types/reports.types';

const ALL_DIMENSIONS: SalesDimension[] = [
  'branch', 'sale_type', 'payment_method', 'situation', 'state', 'city', 'neighborhood',
];

export function useSalesDashboard(filters: ReportsFilters, extra?: SalesExtraFilters) {
  const [granularity, setGranularity] = useState<Granularity>('day');

  const queryKey = [filters, extra];

  const kpis = useQuery({
    queryKey: ['rpt_sales_kpis', ...queryKey],
    queryFn: () => salesService.getKpis(filters, extra),
    staleTime: 1000 * 60 * 5,
  });

  const overTime = useQuery({
    queryKey: ['rpt_sales_over_time', ...queryKey, granularity],
    queryFn: () => salesService.getOverTime(filters, granularity, extra),
    staleTime: 1000 * 60 * 5,
  });

  // Una query por cada dimensión, todas en paralelo
  const byDimensionQueries = Object.fromEntries(
    ALL_DIMENSIONS.map((dim) => [
      dim,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useQuery({
        queryKey: ['rpt_sales_by_dimension', ...queryKey, dim],
        queryFn: () => salesService.getByDimension(filters, dim, extra),
        staleTime: 1000 * 60 * 5,
      }),
    ]),
  ) as Record<SalesDimension, ReturnType<typeof useQuery>>;

  return {
    kpis,
    overTime,
    byDimensionQueries,
    granularity,
    setGranularity,
  };
}
