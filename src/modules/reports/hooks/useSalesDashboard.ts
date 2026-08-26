import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/reports.service';
import type { ReportsFilters, Granularity, SalesDimension, TopMetric, TopLimit } from '../types/reports.types';

// Las dimensiones geográficas (state/city/neighborhood) siguen soportadas por
// el RPC, pero ya no se grafican aquí: la lectura geográfica se cubre aparte.
const ALL_DIMENSIONS: SalesDimension[] = [
  'branch', 'sale_type', 'payment_method', 'situation',
];

export function useSalesDashboard(filters: ReportsFilters) {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [topMetric, setTopMetric] = useState<TopMetric>('revenue');
  const [topLimit, setTopLimit] = useState<TopLimit>(10);

  const {
    startDate, endDate, branchId, countryId, stateId, cityId,
    neighborhoodId, saleTypeId, paymentMethodId, situationIds,
  } = filters;
  // Las situaciones van serializadas: un array nuevo en cada render rompería
  // la igualdad de la queryKey y refetchearía sin necesidad.
  const situationKey = situationIds?.join(',') ?? null;
  const queryKey = [startDate, endDate, branchId, countryId, stateId, cityId, neighborhoodId, saleTypeId, paymentMethodId, situationKey] as const;

  const kpis = useQuery({
    queryKey: ['rpt_sales_kpis', ...queryKey],
    queryFn: () => salesService.getKpis(filters),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const overTime = useQuery({
    queryKey: ['rpt_sales_over_time', ...queryKey, granularity],
    queryFn: () => salesService.getOverTime(filters, granularity),
    staleTime: 1000 * 60 * 5,
    retry: false,
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
        retry: false,
      }),
    ]),
  ) as Record<SalesDimension, ReturnType<typeof useQuery>>;

  const topProducts = useQuery({
    queryKey: ['rpt_top_products_sales', ...queryKey, topMetric, topLimit],
    queryFn: () => salesService.getTopProducts(filters, topMetric, topLimit),
    staleTime: 1000 * 60 * 5,
    retry: false,
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
