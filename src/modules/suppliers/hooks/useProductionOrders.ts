import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  ProductionOrder,
  ProductionOrdersFilters,
} from "../types/productionOrders.types";
import { productionOrdersListApi } from "../services/productionOrders.service";

export const useProductionOrders = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductionOrdersFilters>({
    search: "",
    production_order_class_id: null,
    type: null,
    page: 1,
    size: 20,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productionOrdersListApi({
        ...filters,
        page: pagination.p_page,
        size: pagination.p_size,
      });
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error al cargar órdenes de producción", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  /** Aplica los filtros del modal (clase y tipo de orden). */
  const handleApplyFilters = (applied: ProductionOrdersFilters) => {
    setFilters((prev) => ({
      ...prev,
      production_order_class_id: applied.production_order_class_id ?? null,
      type: applied.type ?? null,
    }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  const hasActiveFilters = Boolean(filters.production_order_class_id || filters.type);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  return {
    orders,
    pagination,
    loading,
    search,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchOrders,
  };
};
