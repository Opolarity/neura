import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PaginationState, Shipping, ShippingFilters } from "../types/Shipping.types";
import { ShippingApi } from "../services/Shipping.service";
import { productAdapter } from "@/modules/products/adapters/Product.adapter";
import { shippingAdapter } from "../adapters/Shipping.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";




export const useShipping = () => {
  const [shippings, setShippings] = useState<Shipping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<ShippingFilters>({
    mincost: null,
    maxcost: null,
    countrie: null,
    state: null,
    city: null,
    neighborhood: null,
    order: null,
    search: null,
    page: 1,
    size: 20,
  });


  const navigate = useNavigate();

    const loadData = async (filters?: ShippingFilters) => {
      setLoading(true);
      setError(null);
  
      try {
        const dataShippings = await ShippingApi(filters);
        const { shippings, pagination } = shippingAdapter(dataShippings);
        setShippings(shippings);
        setPagination(pagination);
      } catch (error) {
        console.error(error);
        setError("Ocurrió un error al cargar los métodos de envío");
      } finally {
        setLoading(false);
      }
    };

    const onSearchChange = (value: string) => {
        setSearch(value);
    };

    const debouncedSearch = useDebounce(search, 500);


    useEffect(() => {
        if (debouncedSearch !== filters.search) {
        const newFilters = { ...filters, search: debouncedSearch, page: 1 };
        setFilters(newFilters);
        loadData(newFilters);
        }
    }, [debouncedSearch]);

    const onPageChange = (page: number) => {
        const newFilters = { ...filters, page };
        setFilters(newFilters);
        loadData(newFilters);
    };

    const onOrderChange = (order: string) => {
        const newFilters = { ...filters, order };
        setFilters(newFilters);
        loadData(newFilters);
    };

    const handlePageSizeChange = (size: number) => {
        const newFilters = { ...filters, size, page: 1 };
        setFilters(newFilters);
        loadData(newFilters);
    };

    const onOpenFilterModal = () => {
        setIsOpenFilterModal(true);
    };
    const onCloseFilterModal = () => {
        setIsOpenFilterModal(false);
    };

    const onApplyFilter = (newFilters: ShippingFilters) => {
        const updatedFilters = { ...newFilters, page: 1, size: filters.size };
        setFilters(updatedFilters);
        loadData(updatedFilters);
        setIsOpenFilterModal(false);
    };

  return {
    shippings,
    pagination,
    loading,
    error,
    search,
    isOpenFilterModal,
    filters,
    onPageChange,
    handlePageSizeChange,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onOrderChange,
  };

};