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

  const byLoyalty = useQuery({
    queryKey: ['rpt_customers_by_loyalty'],
    queryFn: () => customersService.getByLoyalty(),
    staleTime: 1000 * 60 * 10,
  });

  const purchaseFrequency = useQuery({
    queryKey: ['rpt_purchase_frequency', ...queryKey],
    queryFn: () => customersService.getPurchaseFrequency(filters),
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpis,
    topCustomers,
    geoDistribution,
    byLoyalty,
    purchaseFrequency,
    topLimit,
    setTopLimit,
  };
}
