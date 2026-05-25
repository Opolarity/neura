import { useState, useEffect, useCallback } from "react";
import { getInvoicesApi } from "../services/Invoices.services";
import { invoicesAdapter } from "../adapters/Invoices.adapters";
import type { InvoiceItem } from "../types/Invoices.types";

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ p_page: 1, p_size: 20, total: 0 });

  const fetchInvoices = useCallback(async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const apiResponse = await getInvoicesApi({ p_page: page, p_size: size });
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

  const onPageChange = (page: number) => fetchInvoices(page, pagination.p_size);
  const onPageSizeChange = (size: number) => fetchInvoices(1, size);

  return { invoices, loading, pagination, onPageChange, onPageSizeChange };
};
