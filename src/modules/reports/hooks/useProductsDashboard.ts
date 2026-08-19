import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { productsService } from '../services/reports.service';
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

  const queryKey = [filters];

  const byCategory = useQuery({
    queryKey: ['rpt_products_by_category', ...queryKey],
    queryFn: () => productsService.getByCategory(filters),
    staleTime: 1000 * 60 * 5,
  });

  const topByCategory = useQuery({
    queryKey: ['rpt_top_products_by_category', ...queryKey, selectedCategoryId, topLimit],
    queryFn: () => productsService.getTopByCategory(filters, selectedCategoryId, topLimit),
    staleTime: 1000 * 60 * 5,
  });

  const pareto = useQuery({
    queryKey: ['rpt_products_pareto', ...queryKey, paretoLimit],
    queryFn: () => productsService.getPareto(filters, paretoLimit),
    staleTime: 1000 * 60 * 5,
  });

  const salesBySize = useQuery({
    queryKey: ['rpt_products_sales_by_size', ...queryKey],
    queryFn: () => productsService.getSalesBySize(filters),
    staleTime: 1000 * 60 * 5,
  });

  const categoryOverTime = useQuery({
    queryKey: ['rpt_products_category_over_time', ...queryKey, categoryGranularity],
    queryFn: () => productsService.getCategoryOverTime(filters, categoryGranularity),
    staleTime: 1000 * 60 * 5,
  });

  const marginScatter = useQuery({
    queryKey: ['rpt_products_margin_scatter', ...queryKey],
    queryFn: () => productsService.getMarginScatter(filters),
    staleTime: 1000 * 60 * 5,
  });

  const searchResults = useQuery({
    queryKey: ['rpt_product_search', debouncedSearch],
    queryFn: () => productsService.search(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const productDetail = useQuery({
    queryKey: ['rpt_product_detail', appliedProductId, ...queryKey],
    queryFn: () => productsService.getDetail(appliedProductId!, filters),
    enabled: appliedProductId !== null,
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
