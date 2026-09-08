import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { filterOptionsService, productsService } from '../services/reports.service';
import { defaultProductSituationIds } from '../types/reports.types';
import type { Granularity, ParetoLimit, ProductSearchResult, ReportsFilters, TopLimit } from '../types/reports.types';

export function useProductsDashboard(filters: ReportsFilters, applyVersion?: number) {
  const [topLimit, setTopLimit] = useState<TopLimit>(10);
  const [paretoLimit, setParetoLimit] = useState<ParetoLimit>(10);
  const [categoryGranularity, setCategoryGranularity] = useState<Granularity>('week');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  // selectedProductId/Title: lo que el combobox muestra elegido (borrador).
  // appliedProductId/Title: lo que realmente dispara la query de "Análisis de
  // producto individual" — espera al botón Aplicar, igual que el resto de filtros.
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  const [appliedProductId, setAppliedProductId] = useState<number | null>(null);
  const [appliedProductTitle, setAppliedProductTitle] = useState<string>('');

  useEffect(() => {
    setAppliedProductId(selectedProductId);
    setAppliedProductTitle(selectedProductTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion]);

  const debouncedSearch = useDebounce(productSearch, 400);

  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  // El default se resuelve acá, no en el service ni en el SP: vive en una sola
  // función, la misma que marca las casillas del filtro. Lo que se ve marcado
  // es literalmente lo que se envía.
  const situationIds = useMemo(
    () => filters.productSituationIds ?? defaultProductSituationIds(situations.data ?? []),
    [filters.productSituationIds, situations.data],
  );

  // Sin esto los RPC saldrían con un array vacío antes de que llegue el
  // catálogo, devolverían ceros y refetchearían: los gráficos parpadean vacíos.
  const ready = filters.productSituationIds !== null || situations.isSuccess;

  // Las situaciones van serializadas aparte: cambian (de [] a los ids reales)
  // sin que `filters` cambie, así que no basta con meter el objeto entero.
  const situationKey = situationIds.join(',');
  const queryKey = [filters, situationKey];

  const byCategory = useQuery({
    queryKey: ['rpt_products_by_category', ...queryKey],
    queryFn: () => productsService.getByCategory(filters, situationIds),
    staleTime: 1000 * 60 * 5,
    enabled: ready,
  });

  const topByCategory = useQuery({
    queryKey: ['rpt_top_products_by_category', ...queryKey, selectedCategoryId, topLimit],
    queryFn: () => productsService.getTopByCategory(filters, selectedCategoryId, topLimit, situationIds),
    staleTime: 1000 * 60 * 5,
    enabled: ready,
  });

  const pareto = useQuery({
    queryKey: ['rpt_products_pareto', ...queryKey, paretoLimit],
    queryFn: () => productsService.getPareto(filters, paretoLimit, situationIds),
    staleTime: 1000 * 60 * 5,
    enabled: ready,
  });

  const salesBySize = useQuery({
    queryKey: ['rpt_products_sales_by_size', ...queryKey],
    queryFn: () => productsService.getSalesBySize(filters, situationIds),
    staleTime: 1000 * 60 * 5,
    enabled: ready,
  });

  const categoryOverTime = useQuery({
    queryKey: ['rpt_products_category_over_time', ...queryKey, categoryGranularity],
    queryFn: () => productsService.getCategoryOverTime(filters, categoryGranularity, situationIds),
    staleTime: 1000 * 60 * 5,
    enabled: ready,
  });

  const marginScatter = useQuery({
    queryKey: ['rpt_products_margin_scatter', ...queryKey],
    queryFn: () => productsService.getMarginScatter(filters, 100, situationIds),
    staleTime: 1000 * 60 * 5,
    enabled: ready,
  });

  const searchResults = useQuery({
    queryKey: ['rpt_product_search', debouncedSearch],
    queryFn: () => productsService.search(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const productDetail = useQuery({
    queryKey: ['rpt_product_detail', appliedProductId, ...queryKey],
    queryFn: () => productsService.getDetail(appliedProductId!, filters, situationIds),
    enabled: ready && appliedProductId !== null,
    staleTime: 1000 * 60 * 5,
  });

  const selectProduct = (product: ProductSearchResult | null) => {
    if (!product) {
      setSelectedProductId(null);
      setSelectedProductTitle('');
      setProductSearch('');
    } else {
      setSelectedProductId(product.id);
      setSelectedProductTitle(product.title);
    }
  };

  const isProductDirty = selectedProductId !== appliedProductId;

  return {
    byCategory,
    topByCategory,
    pareto,
    salesBySize,
    categoryOverTime,
    marginScatter,
    searchResults,
    productDetail,
    topLimit,
    setTopLimit,
    paretoLimit,
    setParetoLimit,
    categoryGranularity,
    setCategoryGranularity,
    selectedCategoryId,
    setSelectedCategoryId,
    productSearch,
    setProductSearch,
    selectedProductId,
    selectedProductTitle,
    appliedProductId,
    appliedProductTitle,
    selectProduct,
    isProductDirty,
  };
}

export type ProductsDashboardState = ReturnType<typeof useProductsDashboard>;
