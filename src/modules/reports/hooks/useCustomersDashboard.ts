import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersService } from '../services/reports.service';
import type { ReportsFilters } from '../types/reports.types';

export function useCustomersDashboard(filters: ReportsFilters) {
  const [topLimit, setTopLimit] = useState(10);

  const queryKey = [filters];

  const kpis = useQuery({
    queryKey: ['rpt_customers_kpis', ...queryKey],
    queryFn: () => customersService.getKpis(filters),
    staleTime: 1000 * 60 * 5,
  });

  const topCustomers = useQuery({
    queryKey: ['rpt_top_customers', ...queryKey, topLimit],
    queryFn: () => customersService.getTopCustomers(filters, topLimit),
    staleTime: 1000 * 60 * 5,
  });

  const geoDistribution = useQuery({
    queryKey: ['rpt_customers_geo', ...queryKey],
    queryFn: () => customersService.getGeoDistribution(filters),
    staleTime: 1000 * 60 * 5,
  });

  // Desde la migración 31000908142000 respeta el rango y el estado de pedido,
  // así que ya no puede tener una clave sin filtros: antes mostraba las 2770
  // fichas de toda la base sin importar el período.
  const byLoyalty = useQuery({
    queryKey: ['rpt_customers_by_loyalty', ...queryKey],
    queryFn: () => customersService.getByLoyalty(filters),
    staleTime: 1000 * 60 * 10,
  });

  const purchaseFrequency = useQuery({
    queryKey: ['rpt_purchase_frequency', ...queryKey],
    queryFn: () => customersService.getPurchaseFrequency(filters),
    staleTime: 1000 * 60 * 5,
  });

  const newVsReturning = useQuery({
    queryKey: ['rpt_customers_new_vs_returning', ...queryKey],
    queryFn: () => customersService.getNewVsReturning(filters),
    staleTime: 1000 * 60 * 5,
  });

  // Idem: antes solo dependía de la sede y contaba los 1395 clientes del
  // histórico completo; ahora el rango y el estado de pedido entran en juego.
  const recency = useQuery({
    queryKey: ['rpt_customers_recency', ...queryKey],
    queryFn: () => customersService.getRecency(filters),
    staleTime: 1000 * 60 * 5,
  });

  const pareto = useQuery({
    queryKey: ['rpt_customers_pareto', ...queryKey],
    queryFn: () => customersService.getPareto(filters),
    staleTime: 1000 * 60 * 5,
  });

  const bySaleType = useQuery({
    queryKey: ['rpt_customers_by_sale_type', ...queryKey],
    queryFn: () => customersService.getBySaleType(filters),
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpis,
    topCustomers,
    geoDistribution,
    byLoyalty,
    purchaseFrequency,
    newVsReturning,
    recency,
    pareto,
    bySaleType,
    topLimit,
    setTopLimit,
  };
}
