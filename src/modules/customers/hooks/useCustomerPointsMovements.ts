import { useEffect, useState, useCallback } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toast } from "sonner";
import { CustomerPointsMovement } from "../types/customerPoints.types";
import { getCustomerPointsMovementsApi } from "../services/customerPoints.service";
import { customerPointsMovementsAdapter } from "../adapters/customerPoints.adapter";

export type { CustomerPointsMovement };

export const useCustomerPointsMovements = () => {
  const [data, setData] = useState<CustomerPointsMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const from = (pagination.p_page - 1) * pagination.p_size;
      const to = from + pagination.p_size - 1;

      const { data: rows, count } = await getCustomerPointsMovementsApi(search, from, to);
      const mapped = customerPointsMovementsAdapter(rows);

      setData(mapped);
      setPagination((prev) => ({ ...prev, total: count }));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar movimientos de puntos");
    } finally {
      setLoading(false);
    }
  }, [pagination.p_page, pagination.p_size, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  return {
    data,
    loading,
    search,
    pagination,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchData,
  };
};
