import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersService } from '../services/reports.service';
import type { ReportsFilters } from '../types/reports.types';

export function useCustomersDashboard(filters: ReportsFilters) {
  const [topLimit, setTopLimit] = useState(10);
  const [birthdayDays, setBirthdayDays] = useState(30);

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

  const newVsReturning = useQuery({
    queryKey: ['rpt_customers_new_vs_returning', ...queryKey],
    queryFn: () => customersService.getNewVsReturning(filters),
    staleTime: 1000 * 60 * 5,
  });

  const recency = useQuery({
    queryKey: ['rpt_customers_recency', filters.branchId],
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

  const upcomingBirthdays = useQuery({
    queryKey: ['rpt_customers_upcoming_birthdays', birthdayDays],
    queryFn: () => customersService.getUpcomingBirthdays(birthdayDays),
    staleTime: 1000 * 60 * 10,
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
    upcomingBirthdays,
    topLimit,
    setTopLimit,
    birthdayDays,
    setBirthdayDays,
  };
}
