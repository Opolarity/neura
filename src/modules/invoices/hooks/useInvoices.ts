import { useState, useEffect, useCallback } from "react";
import { getInvoicesApi, getInvoiceTypesApi } from "../services/Invoices.services";
import { invoicesAdapter, invoiceTypesAdapter } from "../adapters/Invoices.adapters";
import type { InvoiceItem, InvoiceType } from "../types/Invoices.types";

export interface ActiveInvoiceFilters {
  declared?: boolean | null;
  type?: number | null;
  min_mount?: number | null;
  max_mount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ p_page: 1, p_size: 20, total: 0 });
  const [activeFilters, setActiveFilters] = useState<ActiveInvoiceFilters>({});
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceType[]>([]);
  const [loadingInvoiceTypes, setLoadingInvoiceTypes] = useState(true);

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
      const apiResponse = await getInvoicesApi({ p_page: page, p_size: size, ...filters });
      const adapted = invoicesAdapter(apiResponse);

      setInvoices(adapted.data);
      setPagination({ p_page: page, p_size: size, total: adapted.page.total });
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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

  return { invoices, loading, pagination, onPageChange, onPageSizeChange, activeFilters, applyFilters, clearFilters, invoiceTypes, loadingInvoiceTypes };
};
