import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { returnsService } from '../services/reports.service';
import type { ReportsFilters, Granularity } from '../types/reports.types';

export function useReturnsDashboard(filters: ReportsFilters) {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [topLimit, setTopLimit] = useState(10);

  const queryKey = [filters];

  const kpis = useQuery({
    queryKey: ['rpt_returns_kpis', ...queryKey],
    queryFn: () => returnsService.getKpis(filters),
    staleTime: 1000 * 60 * 5,
  });

  const overTime = useQuery({
    queryKey: ['rpt_returns_over_time', ...queryKey, granularity],
    queryFn: () => returnsService.getOverTime(filters, granularity),
    staleTime: 1000 * 60 * 5,
  });

  const topProducts = useQuery({
    queryKey: ['rpt_top_returned_products', ...queryKey, topLimit],
    queryFn: () => returnsService.getTopProducts(filters, topLimit),
    staleTime: 1000 * 60 * 5,
  });

  const byReason = useQuery({
    queryKey: ['rpt_returns_by_reason', ...queryKey],
    queryFn: () => returnsService.getByReason(filters),
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpis,
    overTime,
    topProducts,
    byReason,
    granularity,
    setGranularity,
    topLimit,
    setTopLimit,
  };
}
