import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { filterOptionsService, productsService } from '../services/reports.service';
import { defaultProductSituationIds } from '../types/reports.types';
import type { Granularity, ParetoLimit, ProductSearchResult, ReportsFilters, TopLimit } from '../types/reports.types';

export function useProductsDashboard(filters: ReportsFilters) {
  const [topLimit, setTopLimit] = useState<TopLimit>(10);
  const [paretoLimit, setParetoLimit] = useState<ParetoLimit>(10);
  const [categoryGranularity, setCategoryGranularity] = useState<Granularity>('week');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  // selectedProductId/Title: lo que el combobox muestra elegido (borrador).
  // appliedProductId/Title: lo que realmente dispara la query de "Análisis de
  // producto individual". Espera al Aplicar PROPIO de esa sección (ProductPicker),
  // no al de la barra: el producto no afecta a los KPIs ni a los gráficos de
  // arriba, así que no tiene por qué pasar por el mismo botón. Los filtros de
  // la barra sí se le aplican, vía `filters` (los ya aplicados).
  // T-560: varios productos a la vez; el detalle suma los elegidos.
  const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);
  const [appliedProducts, setAppliedProducts] = useState<ProductSearchResult[]>([]);

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

  const kpis = useQuery({
    queryKey: ['rpt_products_kpis', ...queryKey],
    queryFn: () => productsService.getKpis(filters, situationIds),
    staleTime: 1000 * 60 * 5,
    enabled: ready,
  });

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

  const appliedProductIds = useMemo(() => appliedProducts.map((p) => p.id), [appliedProducts]);

  const productDetail = useQuery({
    queryKey: ['rpt_product_detail', appliedProductIds.join(','), ...queryKey],
    queryFn: () => productsService.getDetail(appliedProductIds, filters, situationIds),
    enabled: ready && appliedProductIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  /** Marca o desmarca un producto en el borrador; `null` limpia todo. */
  const toggleProduct = (product: ProductSearchResult | null) => {
    if (!product) {
      setSelectedProducts([]);
      setProductSearch('');
      return;
    }
    setSelectedProducts((prev) =>
      prev.some((p) => p.id === product.id) ? prev.filter((p) => p.id !== product.id) : [...prev, product],
    );
  };

  /** Aplica los productos elegidos (o ninguno, para limpiar) a la sección de detalle. */
  const applyProducts = (products: ProductSearchResult[] = selectedProducts) => {
    setAppliedProducts(products);
  };

  const isProductDirty =
    selectedProducts.map((p) => p.id).sort().join(',') !== [...appliedProductIds].sort().join(',');

  return {
    kpis,
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
    selectedProducts,
    appliedProducts,
    toggleProduct,
    applyProducts,
    isProductDirty,
  };
}

export type ProductsDashboardState = ReturnType<typeof useProductsDashboard>;
