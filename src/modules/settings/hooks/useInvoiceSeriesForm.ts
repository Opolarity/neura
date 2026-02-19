import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceSerieForm } from "./useInvoiceSeries";
import { emptyForm } from "./useInvoiceSeries";

export interface PaymentMethodSaleType {
  id: number;
  payment_method_id: number;
  sale_type_id: number;
  tax_serie_id: number | null;
  payment_method_name: string;
  sale_type_name: string;
}

export const useInvoiceSeriesForm = () => {
  const { serieId } = useParams<{ serieId: string }>();
  const isEditing = !!serieId;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<InvoiceSerieForm>(emptyForm);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: number; url: string; branch_id: number; description: string | null }[]>([]);
  const [availableLinks, setAvailableLinks] = useState<PaymentMethodSaleType[]>([]);
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchDropdowns = useCallback(async () => {
    const [accRes, provRes] = await Promise.all([
      supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
      supabase.from("invoice_providers").select("id, url, branch_id, description").order("id"),
    ]);
    if (accRes.data) setAccounts(accRes.data);
    if (provRes.data) setProviders(provRes.data);
  }, []);

  const fetchPaymentMethodLinks = useCallback(async () => {
    let query = supabase
      .from("payment_method_sale_type")
      .select("id, payment_method_id, sale_type_id, tax_serie_id, payment_methods!inner(name, is_active), types:sale_type_id(name)")
      .eq("payment_methods.is_active", true)
      .order("id");

    if (isEditing) {
      query = query.or(`tax_serie_id.is.null,tax_serie_id.eq.${serieId}`);
    } else {
      query = query.is("tax_serie_id", null);
    }

    const { data } = await query;
    if (data) {
      const mapped: PaymentMethodSaleType[] = data.map((item: any) => ({
        id: item.id,
        payment_method_id: item.payment_method_id,
        sale_type_id: item.sale_type_id,
        tax_serie_id: item.tax_serie_id,
        payment_method_name: item.payment_methods?.name || `Método #${item.payment_method_id}`,
        sale_type_name: item.types?.name || `Canal #${item.sale_type_id}`,
      }));
      setAvailableLinks(mapped);

      // Pre-select the ones already linked to this serie
      if (isEditing) {
        const linked = new Set(
          mapped.filter((m) => m.tax_serie_id === parseInt(serieId!)).map((m) => m.id)
        );
        setSelectedLinkIds(linked);
      }
    }
  }, [isEditing, serieId]);

  const fetchSerie = useCallback(async () => {
    if (!serieId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoice_series")
        .select("*")
        .eq("id", parseInt(serieId))
        .single();
      if (error) throw error;
      if (data) {
        setForm({
          account_id: data.account_id.toString(),
          invoice_provider_id: data.invoice_provider_id.toString(),
          fac_serie: data.fac_serie,
          bol_serie: data.bol_serie,
          ncf_serie: data.ncf_serie,
          ncb_serie: data.ncb_serie,
          ndf_serie: data.ndf_serie,
          ndb_serie: data.ndb_serie,
          grr_serie: data.grr_serie,
          grt_serie: data.grt_serie,
          next_number: data.next_number,
          is_active: data.is_active,
          default: data.default,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [serieId, toast]);

  useEffect(() => {
    fetchDropdowns();
    fetchPaymentMethodLinks();
    if (isEditing) fetchSerie();
  }, [fetchDropdowns, fetchPaymentMethodLinks, fetchSerie, isEditing]);

  const updateField = (field: keyof InvoiceSerieForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleLink = (id: number) => {
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveLinks = async (newSerieId: number) => {
    // Unlink: records that were linked but now are not selected
    const toUnlink = availableLinks
      .filter((l) => l.tax_serie_id === newSerieId && !selectedLinkIds.has(l.id))
      .map((l) => l.id);

    // Link: records that are selected
    const toLink = Array.from(selectedLinkIds);

    if (toUnlink.length > 0) {
      await supabase
        .from("payment_method_sale_type")
        .update({ tax_serie_id: null } as any)
        .in("id", toUnlink);
    }

    if (toLink.length > 0) {
      await supabase
        .from("payment_method_sale_type")
        .update({ tax_serie_id: newSerieId } as any)
        .in("id", toLink);
    }
  };

  const saveSerie = async () => {
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

      let savedSerieId: number;

      if (isEditing) {
        const { error } = await supabase
          .from("invoice_series")
          .update(payload)
          .eq("id", parseInt(serieId!));
        if (error) throw error;
        savedSerieId = parseInt(serieId!);
        toast({ title: "Serie actualizada correctamente" });
      } else {
        const { data, error } = await supabase
          .from("invoice_series")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        savedSerieId = data.id;
        toast({ title: "Serie creada correctamente" });
      }

      await saveLinks(savedSerieId);

      navigate("/invoices/series");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    accounts,
    providers,
    availableLinks,
    selectedLinkIds,
    loading,
    saving,
    isEditing,
    updateField,
    toggleLink,
    saveSerie,
  };
};
