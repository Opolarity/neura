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
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: number; url: string; branch_id: number; description: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceSerie | null>(null);
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

  const fetchDropdowns = useCallback(async () => {
    const [accRes, provRes] = await Promise.all([
      supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
      supabase.from("invoice_providers").select("id, url, branch_id, description").order("id"),
    ]);
    if (accRes.data) setAccounts(accRes.data);
    if (provRes.data) setProviders(provRes.data);
  }, []);

  useEffect(() => {
    fetchSeries();
    fetchDropdowns();
  }, [fetchSeries, fetchDropdowns]);

  const saveSerie = async (form: InvoiceSerieForm) => {
    setSaving(true);
    try {
      const payload = {
        account_id: parseInt(form.account_id),
        invoice_provider_id: parseInt(form.invoice_provider_id),
        fac_serie: form.fac_serie,
        bol_serie: form.bol_serie,
        ncf_serie: form.ncf_serie,
        ncb_serie: form.ncb_serie,
        ndf_serie: form.ndf_serie,
        ndb_serie: form.ndb_serie,
        grr_serie: form.grr_serie,
        grt_serie: form.grt_serie,
        next_number: form.next_number,
        is_active: form.is_active,
        default: form.default,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("invoice_series")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast({ title: "Serie actualizada correctamente" });
      } else {
        const { error } = await supabase.from("invoice_series").insert(payload);
        if (error) throw error;
        toast({ title: "Serie creada correctamente" });
      }

      setOpenFormModal(false);
      setEditingItem(null);
      fetchSeries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditItemChange = (item: InvoiceSerie | null) => {
    setEditingItem(item);
  };

  const handleOpenChange = (open: boolean) => {
    setOpenFormModal(open);
    if (!open) setEditingItem(null);
  };

  return {
    series,
    accounts,
    providers,
    loading,
    saving,
    openFormModal,
    editingItem,
    saveSerie,
    handleEditItemChange,
    handleOpenChange,
  };
};
