import { useState, useEffect, useCallback, useRef } from "react";
import { getInvoicesApi, getInvoiceTypesApi } from "../services/Invoices.services";
import { invoicesAdapter, invoiceTypesAdapter } from "../adapters/Invoices.adapters";
import { generateInvoicesExcel } from "../utils/generateInvoicesExcel";
import type { InvoiceItem, InvoiceType } from "../types/Invoices.types";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";

export interface ActiveInvoiceFilters {
  declared?: boolean | null;
  types?: number[] | null;
  min_mount?: number | null;
  max_mount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [pagination, setPagination] = useState({ p_page: 1, p_size: 20, total: 0 });
  const [activeFilters, setActiveFilters] = useState<ActiveInvoiceFilters>({});
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
  const [loadingInvoiceTypes, setLoadingInvoiceTypes] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // La búsqueda vive aparte de los filtros del modal ("Limpiar" no la borra),
  // pero viaja en cada petición. Ref para no leerla de un render viejo.
  const searchRef = useRef("");
  searchRef.current = debouncedSearch.trim();

  useEffect(() => {
    const fetchInvoiceTypes = async () => {
      setLoadingInvoiceTypes(true);
      try {
        const apiResponse = await getInvoiceTypesApi();
        setInvoiceTypes(invoiceTypesAdapter(apiResponse));
      } catch (err) {
        console.error("Error fetching invoice types:", err);
      } finally {
        setLoadingInvoiceTypes(false);
      }
    };

    fetchInvoiceTypes();
  }, []);

  const fetchInvoices = useCallback(async (page = 1, size = 20, filters: ActiveInvoiceFilters = {}) => {
    setLoading(true);
    try {
      const apiResponse = await getInvoicesApi({ p_page: page, p_size: size, search: searchRef.current, ...filters });
      const adapted = invoicesAdapter(apiResponse);

      setInvoices(adapted.data);
      setPagination({ p_page: page, p_size: size, total: adapted.page.total });
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial y cada vez que cambia la búsqueda: vuelve a la página 1.
  useEffect(() => {
    fetchInvoices(1, pagination.p_size, activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchInvoices, debouncedSearch]);

  const onPageChange = (page: number) => fetchInvoices(page, pagination.p_size, activeFilters);
  const onPageSizeChange = (size: number) => fetchInvoices(1, size, activeFilters);

  const applyFilters = (filters: ActiveInvoiceFilters) => {
    setActiveFilters(filters);
    fetchInvoices(1, pagination.p_size, filters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    fetchInvoices(1, pagination.p_size, {});
  };

  // Exporta todos los comprobantes que cumplen los filtros y la búsqueda
  // vigentes, no solo la página visible: el backend no tiene modo "sin
  // paginar", así que se pide una única página del tamaño del total.
  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const apiResponse = await getInvoicesApi({
        ...activeFilters,
        search: searchRef.current,
        p_page: 1,
        p_size: pagination.total || 9999,
      });
      const rows = invoicesAdapter(apiResponse).data;

      if (rows.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay comprobantes que cumplan los filtros aplicados",
          variant: "info",
        });
        return;
      }

      generateInvoicesExcel(rows, activeFilters);
      toast({
        title: "Excel generado",
        description: `${rows.length} comprobantes exportados`,
        variant: "success",
      });
    } catch (error) {
      toastError(error, "No se pudo generar el Excel");
    } finally {
      setExportLoading(false);
    }
  };

  return {
    invoices,
    loading,
    pagination,
    onPageChange,
    onPageSizeChange,
    activeFilters,
    applyFilters,
    clearFilters,
    invoiceTypes,
    loadingInvoiceTypes,
    search,
    setSearch,
    exportToExcel,
    exportLoading,
  };
};
