// T-596 · Pestaña "Variaciones" de Edición masiva.
//
// Mismo esqueleto que useProducts (búsqueda con debounce, filtros, paginación y
// selección), pero el registro es la VARIACIÓN, porque el stock mínimo se
// guarda por variation_id. La selección, por lo tanto, guarda variationId.
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { getTags } from "@/shared/services/service";
import type { TagsResponse } from "@/shared/types/type";
import type { CategoryOption } from "@/shared/components/category-selector";
import type { PaginationState } from "@/modules/products/types/Products.types";
import {
  getTermOptionsApi,
  getVariationsMinStockApi,
  getWholesaleChannelApi,
  saveMassiveMinStockApi,
} from "../services/MinimumStock.service";
import { variationsMinStockAdapter } from "../adapters/VariationMinStock.adapter";
import type {
  TermOption,
  VariationMinStock,
  VariationsMinStockFilters,
} from "../types/MinimumStock.types";

const EMPTY_FILTERS: VariationsMinStockFilters = {
  minprice: null,
  maxprice: null,
  category_ids: [],
  term: null,
  status: null,
  web: null,
  minstock: null,
  maxstock: null,
  order: null,
  search: null,
  tag: null,
  brand: null,
  page: 1,
  size: 20,
};

export const useVariationsMinStock = () => {
  const [variations, setVariations] = useState<VariationMinStock[]>([]);
  const [defaultMinStock, setDefaultMinStock] = useState<number | null>(null);
  const [channel, setChannel] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>(
    [],
  );
  const [tags, setTags] = useState<TagsResponse[]>([]);
  const [brands, setBrands] = useState<TagsResponse[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<VariationsMinStockFilters>(EMPTY_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<number[]>([]);

  const loadData = useCallback(
    async (nextFilters: VariationsMinStockFilters, channelId: number | null) => {
      setLoading(true);
      setError(null);
      try {
        const response = await getVariationsMinStockApi({
          ...nextFilters,
          channel_id: channelId,
        });
        const adapted = variationsMinStockAdapter(response);
        setVariations(adapted.variations);
        setPagination(adapted.pagination);
        setDefaultMinStock(adapted.defaultMinStock);
      } catch (err) {
        console.error(err);
        setError("Ocurrió un error al cargar las variaciones");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // El canal manda: define el almacén del stock que se muestra y contra qué
  // canal se leen y escriben los mínimos. Sin él no se carga el listado.
  useEffect(() => {
    const init = async () => {
      try {
        const wholesale = await getWholesaleChannelApi();
        setChannel(wholesale);
        await loadData(EMPTY_FILTERS, wholesale?.id ?? null);
      } catch (err) {
        console.error(err);
        setError("No se pudo resolver el canal de la web mayorista");
      }
    };
    init();
  }, [loadData]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [dataTags, termOptions] = await Promise.all([
          getTags(),
          getTermOptionsApi(),
        ]);
        setTags(dataTags.filter((t) => t.type === "tag"));
        setBrands(dataTags.filter((t) => t.type === "brand"));
        setTerms(termOptions);
      } catch (err) {
        console.error("Error loading catalogs:", err);
      }
    };
    loadCatalogs();
  }, []);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch === (filters.search ?? "")) return;
    const nextFilters = { ...filters, search: debouncedSearch || null, page: 1 };
    setFilters(nextFilters);
    loadData(nextFilters, channel?.id ?? null);
    // Solo reacciona al texto: el resto de dependencias dispararía recargas
    // duplicadas con cada cambio de filtro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const applyFilters = (nextFilters: VariationsMinStockFilters) => {
    setFilters(nextFilters);
    loadData(nextFilters, channel?.id ?? null);
  };

  const reload = () => loadData(filters, channel?.id ?? null);

  const onSearchChange = (value: string) => setSearch(value);

  const onPageChange = (page: number) => applyFilters({ ...filters, page });

  const onOrderChange = (order: string) =>
    applyFilters({ ...filters, order, page: 1 });

  const handlePageSizeChange = (size: number) =>
    applyFilters({ ...filters, size, page: 1 });

  const onOpenFilterModal = () => setIsOpenFilterModal(true);
  const onCloseFilterModal = () => setIsOpenFilterModal(false);

  const onApplyFilter = (nextFilters: VariationsMinStockFilters) => {
    applyFilters({ ...nextFilters, page: 1, size: filters.size });
    setIsOpenFilterModal(false);
  };

  const toggleSelectAll = () => {
    if (selectedVariations.length === variations.length) {
      setSelectedVariations([]);
    } else {
      setSelectedVariations(variations.map((v) => v.variationId));
    }
  };

  const toggleVariationSelection = (variationId: number) => {
    setSelectedVariations((prev) =>
      prev.includes(variationId)
        ? prev.filter((id) => id !== variationId)
        : [...prev, variationId],
    );
  };

  /**
   * `minStock = null` borra las filas: esas variaciones vuelven al mínimo por
   * defecto. Al terminar se recarga el listado para que la columna Mínimo
   * muestre lo que realmente quedó guardado.
   */
  const saveMinStock = async (minStock: number | null) => {
    if (!channel) {
      throw new Error("No se pudo resolver el canal de la web mayorista");
    }
    const result = await saveMassiveMinStockApi(
      selectedVariations,
      channel.id,
      minStock,
    );
    await reload();
    return result;
  };

  const hasActiveFilters =
    filters.minprice != null ||
    filters.maxprice != null ||
    !!filters.category_ids?.length ||
    filters.term != null ||
    filters.status != null ||
    filters.web != null ||
    filters.minstock != null ||
    filters.maxstock != null ||
    filters.tag != null ||
    filters.brand != null;

  return {
    variations,
    defaultMinStock,
    channel,
    selectedCategories,
    setSelectedCategories,
    tags,
    brands,
    terms,
    loading,
    error,
    search,
    filters,
    pagination,
    isOpenFilterModal,
    selectedVariations,
    hasActiveFilters,
    onSearchChange,
    onPageChange,
    onOrderChange,
    handlePageSizeChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    toggleSelectAll,
    toggleVariationSelection,
    saveMinStock,
  };
};
