import { useCallback, useEffect, useState } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  getComplaintsApi,
  getComplaintsExportApi,
} from "../services/reclamaciones.service";
import { reclamacionesAdapter } from "../adapters/Reclamaciones.adapter";
import { generateComplaintsBookExcel } from "../utils/generateComplaintsBookExcel";
import type {
  Complaint,
  ComplaintStatus,
} from "../types/reclamaciones.types";

/**
 * Listado del libro de reclamaciones.
 *
 * La paginación es del servidor: antes se pedían siempre 20 filas y se
 * paginaba en memoria sobre ellas, así que a partir de la fila 21 la pantalla
 * no mostraba nada aunque el total dijera lo contrario.
 */
export const useReclamaciones = () => {
  const [reclamaciones, setReclamaciones] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const debouncedSearch = useDebounce(search, 500);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const loadReclamaciones = useCallback(
    async (page: number, size: number, currentSearch: string, currentStatus: ComplaintStatus | "") => {
      setLoading(true);
      try {
        const response = await getComplaintsApi({
          page,
          size,
          search: currentSearch || undefined,
          status: currentStatus || undefined,
        });

        const { data, pagination: nextPagination } = reclamacionesAdapter(response);
        setReclamaciones(data);
        setPagination(nextPagination);
      } catch (error) {
        toastError(error, "Error al cargar las reclamaciones");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Al cambiar la búsqueda o el filtro se vuelve a la primera página: quedarse
  // en la página 7 de un resultado que ahora tiene 2 mostraría una tabla vacía.
  useEffect(() => {
    loadReclamaciones(1, pagination.p_size, debouncedSearch, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await getComplaintsExportApi({
        search: debouncedSearch || undefined,
        status: status || undefined,
      });

      const rows = response?.data ?? [];
      if (rows.length === 0) {
        toast({
          title: "No hay reclamaciones para exportar",
          description: "Ajusta los filtros e inténtalo de nuevo.",
        });
        return;
      }

      generateComplaintsBookExcel(rows);
    } catch (error) {
      toastError(error, "Error al exportar el libro de reclamaciones");
    } finally {
      setExporting(false);
    }
  };

  return {
    reclamaciones,
    loading,
    exporting,
    search,
    status,
    pagination,
    onSearchChange: (value: string) => setSearch(value),
    onStatusChange: (value: ComplaintStatus | "") => setStatus(value),
    onPageChange: (page: number) =>
      loadReclamaciones(page, pagination.p_size, debouncedSearch, status),
    onPageSizeChange: (size: number) =>
      loadReclamaciones(1, size, debouncedSearch, status),
    onExport: handleExport,
  };
};
