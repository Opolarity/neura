import { useState, useEffect } from "react";
import { getReclamaciones, Reclamacion } from "../services/reclamaciones.service";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toast } from "sonner";

export const useReclamaciones = () => {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const loadReclamaciones = async (
    page = pagination.p_page,
    size = pagination.p_size,
    currentSearch = debouncedSearch
  ) => {
    setLoading(true);
    try {
      const { data, total } = await getReclamaciones({
        page,
        size,
        search: currentSearch || undefined,
      });
      setReclamaciones(data);
      setPagination((prev) => ({ ...prev, p_page: page, p_size: size, total }));
    } catch (error) {
      console.error("Error al cargar reclamaciones:", error);
      toast.error("Error al cargar las reclamaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReclamaciones(1, pagination.p_size, debouncedSearch);
  }, [debouncedSearch]);

  return {
    reclamaciones,
    loading,
    search,
    pagination,
    onSearchChange: (value: string) => setSearch(value),
    onPageChange: (page: number) => loadReclamaciones(page, pagination.p_size, debouncedSearch),
    onPageSizeChange: (size: number) => loadReclamaciones(1, size, debouncedSearch),
  };
};

