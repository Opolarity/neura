import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  SaleListItem,
  SalesFilters,
  SalesPaginationState,
  SaleType,
  SaleStatus,
} from "../types/Sales.types";
import {
  fetchSalesList,
  fetchSaleTypes,
  fetchSaleStatuses,
} from "../services/Sales.service";
import { salesListAdapter } from "../adapters/Sales.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";

export const useSales = () => {
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [saleTypes, setSaleTypes] = useState<SaleType[]>([]);
  const [saleStatuses, setSaleStatuses] = useState<SaleStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<SalesPaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<SalesFilters>({
    search: null,
    status: null,
    saleType: null,
    startDate: null,
    endDate: null,
    order: "date_desc",
    page: 1,
    size: 20,
  });
  const [selectedSales, setSelectedSales] = useState<number[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async (currentFilters: SalesFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchSalesList(currentFilters);
      const { sales: salesData, pagination: paginationData } =
        salesListAdapter(response);
      setSales(salesData);
      setPagination(paginationData);
    } catch (err) {
      console.error("Error loading sales:", err);
      setError("Ocurrió un error al cargar las ventas");
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data and metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [types, statuses] = await Promise.all([
          fetchSaleTypes(),
          fetchSaleStatuses(),
        ]);
        setSaleTypes(types);
        setSaleStatuses(statuses);
      } catch (err) {
        console.error("Error loading metadata:", err);
      }
    };
    loadMetadata();
  }, []);

  // Debounced search
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch || null, page: 1 };
      setFilters(newFilters);
      loadData(newFilters);
    }
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    loadData(filters);
  }, []);

  const onSearchChange = (value: string) => {
    setSearch(value);
  };

  const onPageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const onOrderChange = (order: string) => {
    const newFilters = { ...filters, order, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const toggleSelectAll = () => {
    if (selectedSales.length === sales.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(sales.map((sale) => sale.id));
    }
  };

  const toggleSaleSelection = (saleId: number) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

  const onOpenFilterModal = () => {
    setIsOpenFilterModal(true);
  };

  const onCloseFilterModal = () => {
    setIsOpenFilterModal(false);
  };

  const onApplyFilter = (newFilters: Partial<SalesFilters>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1,
    };
    setFilters(updatedFilters);
    loadData(updatedFilters);
    setIsOpenFilterModal(false);
  };

  const onClearFilters = () => {
    const clearedFilters: SalesFilters = {
      search: null,
      status: null,
      saleType: null,
      startDate: null,
      endDate: null,
      order: "date_desc",
      page: 1,
      size: filters.size,
    };
    setFilters(clearedFilters);
    setSearch("");
    loadData(clearedFilters);
    setIsOpenFilterModal(false);
  };

  const goToNewSale = () => {
    navigate("/sales/create");
  };

  const goToSaleDetail = (id: number) => {
    navigate(`/sales/edit/${id}`);
  };

  const hasActiveFilters =
    filters.status !== null ||
    filters.saleType !== null ||
    filters.startDate !== null ||
    filters.endDate !== null;

  return {
    sales,
    saleTypes,
    saleStatuses,
    loading,
    error,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    selectedSales,
    hasActiveFilters,
    onSearchChange,
    onPageChange,
    onOrderChange,
    handlePageSizeChange,
    toggleSelectAll,
    toggleSaleSelection,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onClearFilters,
    goToNewSale,
    goToSaleDetail,
  };
};
