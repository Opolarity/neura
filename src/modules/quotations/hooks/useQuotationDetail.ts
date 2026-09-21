import { useCallback, useEffect, useState } from "react";
import { fetchQuotationById, fetchQuotationByIdServices } from "../services/Quotations.service";
import { QuotationDetailApi, QuotationServiceApi, QuotationsPaginationState, ServiceTab } from "../types/Quotations.types";

export const useQuotationDetail = (id: number) => {
  const [quotation, setQuotation] = useState<QuotationDetailApi["quotation"] | null>(null);
  const [services, setServices] = useState<QuotationServiceApi[]>([]);
  const [pagination, setPagination] = useState<QuotationsPaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  // Pestaña activa. Viaja al backend como un filtro más, igual que la
  // búsqueda, para que el total y la paginación sean los de esa pestaña.
  const [serviceKind, setServiceKind] = useState<ServiceTab>("SERVICE");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuotationById(id);
      setQuotation(data.quotation);
    } catch (err) {
      console.error("Error fetching quotation detail:", err);
      setError("No se pudo cargar la cotización");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadServices = useCallback(
    async (page: number, size: number, searchTerm: string, kind: ServiceTab) => {
      if (!id) return;
      setLoadingServices(true);
      try {
        const response = await fetchQuotationByIdServices({
          id,
          search: searchTerm || null,
          page,
          size,
          kind,
        });
        setServices(response.data);
        setPagination({
          p_page: response.page.page,
          p_size: response.page.size,
          total: response.page.total,
        });
      } catch (err) {
        console.error("Error fetching quotation services:", err);
        setError("No se pudieron cargar los servicios de la cotización");
      } finally {
        setLoadingServices(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load();
    loadServices(1, 20, "", "SERVICE");
  }, [load, loadServices]);

  const onPageChange = useCallback(
    (page: number) => {
      loadServices(page, pagination.p_size, search, serviceKind);
    },
    [loadServices, pagination.p_size, search, serviceKind],
  );

  const onPageSizeChange = useCallback(
    (size: number) => {
      loadServices(1, size, search, serviceKind);
    },
    [loadServices, search, serviceKind],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      loadServices(1, pagination.p_size, value, serviceKind);
    },
    [loadServices, pagination.p_size, serviceKind],
  );

  /** Cambiar de pestaña recarga desde la página 1: es otra lista. */
  const onServiceKindChange = useCallback(
    (kind: ServiceTab) => {
      setServiceKind(kind);
      loadServices(1, pagination.p_size, search, kind);
    },
    [loadServices, pagination.p_size, search],
  );

  const refetch = useCallback(async () => {
    await Promise.all([
      load(),
      loadServices(pagination.p_page, pagination.p_size, search, serviceKind),
    ]);
  }, [load, loadServices, pagination.p_page, pagination.p_size, search, serviceKind]);

  return {
    quotation,
    services,
    serviceKind,
    onServiceKindChange,
    pagination,
    loading,
    loadingServices,
    error,
    search,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    refetch,
  };
};
