import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialService } from '../services/reports.service';
import type { ReportsFilters, Granularity } from '../types/reports.types';

export function useFinancialDashboard(filters: ReportsFilters) {
  const [granularity, setGranularity] = useState<Granularity>('day');

  const queryKey = [filters];

  const kpis = useQuery({
    queryKey: ['rpt_financial_kpis', ...queryKey],
    queryFn: () => financialService.getKpis(filters),
    staleTime: 1000 * 60 * 5,
  });

  const cashflowOverTime = useQuery({
    queryKey: ['rpt_cashflow_over_time', ...queryKey, granularity],
    queryFn: () => financialService.getCashflowOverTime(filters, granularity),
    staleTime: 1000 * 60 * 5,
  });

  const byClass = useQuery({
    queryKey: ['rpt_financial_by_class', ...queryKey],
    queryFn: () => financialService.getByClass(filters),
    staleTime: 1000 * 60 * 5,
  });

  const byPaymentMethod = useQuery({
    queryKey: ['rpt_financial_by_payment', ...queryKey],
    queryFn: () => financialService.getByPaymentMethod(filters),
    staleTime: 1000 * 60 * 5,
  });

  const accountBalances = useQuery({
    queryKey: ['rpt_account_balances'],
    queryFn: () => financialService.getAccountBalances(),
    staleTime: 1000 * 60 * 10,
  });

  return {
    kpis,
    cashflowOverTime,
    byClass,
    byPaymentMethod,
    accountBalances,
    granularity,
    setGranularity,
  };
}
