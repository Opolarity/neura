import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { productsService } from '../services/reports.service';
import type { ProductSearchResult, ReportsFilters, TopLimit } from '../types/reports.types';

export function useProductsDashboard(filters: ReportsFilters) {
  const [topLimit, setTopLimit] = useState<TopLimit>(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');

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

  const searchResults = useQuery({
    queryKey: ['rpt_product_search', debouncedSearch],
    queryFn: () => productsService.search(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const productDetail = useQuery({
    queryKey: ['rpt_product_detail', selectedProductId, ...queryKey],
    queryFn: () => productsService.getDetail(selectedProductId!, filters),
    enabled: selectedProductId !== null,
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

  return {
    byCategory,
    topByCategory,
    searchResults,
    productDetail,
    topLimit,
    setTopLimit,
    selectedCategoryId,
    setSelectedCategoryId,
    productSearch,
    setProductSearch,
    selectedProductId,
    selectedProductTitle,
    selectProduct,
  };
}

export type ProductsDashboardState = ReturnType<typeof useProductsDashboard>;
