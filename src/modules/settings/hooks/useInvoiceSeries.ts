import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InvoiceSerie {
  id: number;
  account_id: number;
  invoice_provider_id: number;
  invoice_type_id: number;
  serie: string | null;
  next_number: number;
  is_active: boolean;
  created_at: string;
  account_name?: string;
  invoice_type_name?: string;
}

export interface InvoiceSerieForm {
  account_id: string;
  invoice_provider_id: string;
  invoice_type_id: string;
  serie: string;
  next_number: number;
  is_active: boolean;
}

export const emptyForm: InvoiceSerieForm = {
  account_id: "",
  invoice_provider_id: "",
  invoice_type_id: "",
  serie: "",
  next_number: 1,
  is_active: true,
};

export const useInvoiceSeries = () => {
  const [series, setSeries] = useState<InvoiceSerie[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoice_series")
        .select("*, accounts(name), types:invoice_type_id(name)")
        .order("id");

      if (error) throw error;
      setSeries(
        (data || []).map((item: any) => ({
          ...item,
          account_name: item.accounts?.name || "-",
          invoice_type_name: item.types?.name || "-",
        }))
      );
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  return { series, loading };
};
