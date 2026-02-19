import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvoiceRow {
  id: number;
  tax_serie: string | null;
  total_amount: number;
  client_name: string | null;
  customer_document_number: string;
  created_at: string;
  declared: boolean;
  invoice_type_name: string;
  order_id: number | null;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ p_page: 1, p_size: 20, total: 0 });

  const fetchInvoices = useCallback(async (page = 1, size = 20) => {
    setLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true });

      const from = (page - 1) * size;
      const to = from + size - 1;

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          tax_serie,
          total_amount,
          client_name,
          customer_document_number,
          created_at,
          declared,
          invoice_type_id
        `)
        .order("id", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Get type names for the invoice_type_ids
      const typeIds = [...new Set((data || []).map(d => d.invoice_type_id))];
      let typesMap: Record<number, string> = {};
      if (typeIds.length > 0) {
        const { data: types } = await supabase
          .from("types" as any)
          .select("id, name")
          .in("id", typeIds);
        if (types) {
          (types as any[]).forEach((t: any) => { typesMap[t.id] = t.name; });
        }
      }

      // Get order_ids from order_invoices
      const invoiceIds = (data || []).map(d => d.id);
      let orderMap: Record<number, number> = {};
      if (invoiceIds.length > 0) {
        const { data: orderInvoices } = await supabase
          .from("order_invoices")
          .select("invoice_id, order_id")
          .in("invoice_id", invoiceIds);
        if (orderInvoices) {
          orderInvoices.forEach((oi) => { orderMap[oi.invoice_id] = oi.order_id; });
        }
      }

      const rows: InvoiceRow[] = (data || []).map(d => ({
        id: d.id,
        tax_serie: d.tax_serie,
        total_amount: d.total_amount,
        client_name: d.client_name,
        customer_document_number: d.customer_document_number,
        created_at: d.created_at,
        declared: d.declared,
        invoice_type_name: typesMap[d.invoice_type_id] || "—",
        order_id: orderMap[d.id] || null,
      }));

      setInvoices(rows);
      setPagination({ p_page: page, p_size: size, total: count || 0 });
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
