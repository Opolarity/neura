import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InvoiceSerie {
  id: number;
  account_id: number;
  invoice_provider_id: number;
  fac_serie: string;
  bol_serie: string;
  ncf_serie: string;
  ncb_serie: string;
  ndf_serie: string;
  ndb_serie: string;
  grr_serie: string;
  grt_serie: string;
  next_number: number;
  is_active: boolean;
  default: boolean;
  created_at: string;
  account_name?: string;
  provider_url?: string;
}

export interface InvoiceSerieForm {
  account_id: string;
  invoice_provider_id: string;
  fac_serie: string;
  bol_serie: string;
  ncf_serie: string;
  ncb_serie: string;
  ndf_serie: string;
  ndb_serie: string;
  grr_serie: string;
  grt_serie: string;
  next_number: number;
  is_active: boolean;
  default: boolean;
}

export const emptyForm: InvoiceSerieForm = {
  account_id: "",
  invoice_provider_id: "",
  fac_serie: "",
  bol_serie: "",
  ncf_serie: "",
  ncb_serie: "",
  ndf_serie: "",
  ndb_serie: "",
  grr_serie: "",
  grt_serie: "",
  next_number: 1,
  is_active: true,
  default: false,
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
        .select("*, accounts(name)")
        .order("id");

      if (error) throw error;
      setSeries(
        (data || []).map((item: any) => ({
          ...item,
          account_name: item.accounts?.name || "-",
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
