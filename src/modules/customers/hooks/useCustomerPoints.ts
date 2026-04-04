import { useEffect, useState, useCallback } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toast } from "sonner";
import { CustomerPoint } from "../types/customerPoints.types";
import { getCustomerPointsApi } from "../services/customerPoints.service";
import { customerPointsAdapter } from "../adapters/customerPoints.adapter";

export type { CustomerPoint };

export const useCustomerPoints = () => {
  const [data, setData] = useState<CustomerPoint[]>([]);
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

      const { data: rows, count } = await getCustomerPointsApi(search, from, to);
      const mapped = customerPointsAdapter(rows);

      setData(mapped);
      setPagination((prev) => ({ ...prev, total: count }));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar puntos de clientes");
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
