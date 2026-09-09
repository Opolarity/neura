import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialService, filterOptionsService } from '../services/reports.service';
import type { ReportsFilters, Granularity } from '../types/reports.types';
import { defaultSituationIds } from '../types/reports.types';

/** Cuántos productos trae la tabla de margen. El título de la tarjeta lo dice. */
export const MARGIN_LIMIT = 20;

export function useFinancialDashboard(filters: ReportsFilters) {
  const [granularity, setGranularity] = useState<Granularity>('day');

  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  // El default se resuelve acá, no en el SP: lo que se ve marcado en el filtro
  // es literalmente lo que se envía. Y sobre todo, las dos mitades de la
  // pantalla que miden pedidos reciben el MISMO array — que es lo que hace que
  // las tarjetas de ganancia cierren con la tabla de margen.
  const situationIds = useMemo(
    () => filters.situationIds ?? defaultSituationIds(situations.data ?? []),
    [filters.situationIds, situations.data],
  );

  // Sin esto los dos RPC de pedidos saldrían con un array vacío antes de que
  // llegue el catálogo, devolverían ceros y refetchearían.
  const ready = filters.situationIds !== null || situations.isSuccess;

  // Las situaciones cambian (de [] a los ids reales) sin que `filters` cambie,
  // así que no alcanza con meter el objeto entero en la key.
  const situationKey = situationIds.join(',');
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

  const profitKpis = useQuery({
    queryKey: ['rpt_financial_profit_kpis', ...queryKey, situationKey],
    queryFn: () => financialService.getProfitKpis(filters, situationIds),
    enabled: ready,
    staleTime: 1000 * 60 * 5,
  });

  const marginByProduct = useQuery({
    queryKey: ['rpt_financial_margin_by_product', ...queryKey, situationKey],
    queryFn: () => financialService.getMarginByProduct(filters, situationIds, MARGIN_LIMIT),
    enabled: ready,
    staleTime: 1000 * 60 * 5,
  });

  return {
    kpis,
    cashflowOverTime,
    byClass,
    byPaymentMethod,
    profitKpis,
    marginByProduct,
    granularity,
    setGranularity,
  };
}
