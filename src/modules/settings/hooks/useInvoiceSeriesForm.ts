import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceSerieForm } from "./useInvoiceSeries";
import { emptyForm } from "./useInvoiceSeries";

export const useInvoiceSeriesForm = () => {
  const { serieId } = useParams<{ serieId: string }>();
  const isEditing = !!serieId;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<InvoiceSerieForm>(emptyForm);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: number; url: string; branch_id: number; description: string | null }[]>([]);
  const [invoiceTypes, setInvoiceTypes] = useState<{ id: number; name: string; code: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchDropdowns = useCallback(async () => {
    const [accRes, provRes, typesRes] = await Promise.all([
      supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
      supabase.from("invoice_providers").select("id, url, branch_id, description").order("id"),
      supabase.from("types").select("id, name, code, modules!inner(code)").eq("modules.code", "INV").order("id"),
    ]);
    if (accRes.data) setAccounts(accRes.data);
    if (provRes.data) setProviders(provRes.data);
    if (typesRes.data) setInvoiceTypes((typesRes.data as any[]).map(t => ({ id: t.id, name: t.name, code: t.code })));
  }, []);

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
          invoice_type_id: data.invoice_type_id.toString(),
          serie: data.serie || "",
          next_number: data.next_number,
          is_active: data.is_active,
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
    if (isEditing) fetchSerie();
  }, [fetchDropdowns, fetchSerie, isEditing]);

  const updateField = (field: keyof InvoiceSerieForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveSerie = async () => {
    setSaving(true);
    try {
      const payload = {
        account_id: parseInt(form.account_id),
        invoice_provider_id: parseInt(form.invoice_provider_id),
        invoice_type_id: parseInt(form.invoice_type_id),
        serie: form.serie || null,
        next_number: form.next_number,
        is_active: form.is_active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("invoice_series")
          .update(payload)
          .eq("id", parseInt(serieId!));
        if (error) throw error;
        toast({ title: "Serie actualizada correctamente" });
      } else {
        const { error } = await supabase
          .from("invoice_series")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        toast({ title: "Serie creada correctamente" });
      }

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
    invoiceTypes,
    loading,
    saving,
    isEditing,
    updateField,
    saveSerie,
  };
};
