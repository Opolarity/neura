import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sellersService } from '../services/reports.service';
import type { Granularity, ReportsFilters, SellersMetric, TopLimit } from '../types/reports.types';

/**
 * Reporte "Ventas por usuarios (vendedores)". Vendedor = quien registró el
 * pedido; las ventas de web y chatbot no tienen vendedor y se muestran
 * aparte. Todas las queries reciben los filtros ya aplicados en la barra.
 */
export function useSellersDashboard(filters: ReportsFilters) {
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [topLimit, setTopLimit] = useState<TopLimit>(10);
  const [topMetric, setTopMetric] = useState<SellersMetric>('revenue');

  const queryKey = [filters];

  const kpis = useQuery({
    queryKey: ['rpt_sellers_kpis', ...queryKey],
    queryFn: () => sellersService.getKpis(filters),
    staleTime: 1000 * 60 * 5,
  });

  // Una sola consulta alimenta el ranking (el front corta el top) y la tabla.
  const summary = useQuery({
    queryKey: ['rpt_sellers_summary', ...queryKey],
    queryFn: () => sellersService.getSummary(filters),
    staleTime: 1000 * 60 * 5,
  });

  const byBranch = useQuery({
    queryKey: ['rpt_sellers_by_branch', ...queryKey],
    queryFn: () => sellersService.getByBranch(filters),
    staleTime: 1000 * 60 * 5,
  });

  const overTime = useQuery({
    queryKey: ['rpt_sellers_over_time', ...queryKey, granularity],
    queryFn: () => sellersService.getOverTime(filters, granularity),
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpis,
    summary,
    byBranch,
    overTime,
    granularity,
    setGranularity,
    topLimit,
    setTopLimit,
    topMetric,
    setTopMetric,
  };
}

export type SellersDashboardState = ReturnType<typeof useSellersDashboard>;
