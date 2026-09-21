import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { Supplier, SuppliersFilters } from "../types/suppliers.types";
import { suppliersListApi } from "../services/suppliers.service";

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SuppliersFilters>({
    search: "",
    page: 1,
    size: 20,
  });

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await suppliersListApi({
        ...filters,
        page: pagination.p_page,
        size: pagination.p_size,
      });
      setSuppliers(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error al cargar proveedores", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  return {
    suppliers,
    pagination,
    loading,
    search,
    filters,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchSuppliers,
  };
};
