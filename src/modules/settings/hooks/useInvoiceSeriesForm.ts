import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceSerieForm } from "./useInvoiceSeries";
import { emptyForm } from "./useInvoiceSeries";

export interface SaleChannel {
  id: number;
  name: string;
  code: string;
  linked: boolean;
}

export const useInvoiceSeriesForm = () => {
  const { serieId } = useParams<{ serieId: string }>();
  const isEditing = !!serieId;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<InvoiceSerieForm>(emptyForm);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [providers, setProviders] = useState<{ id: number; url: string; branch_id: number; description: string | null }[]>([]);
  const [saleChannels, setSaleChannels] = useState<SaleChannel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<number>>(new Set());
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

  const fetchSaleChannels = useCallback(async () => {
    const { data: channels } = await supabase
      .from("types")
      .select("id, name, code, modules!inner(code)")
      .eq("modules.code", "ORD")
      .order("id");

    if (!channels) return;

    const { data: existing } = await (supabase as any)
      .from("sale_type_invoice_series")
      .select("id, sale_type_id, tax_serie_id");

    const existingMap = new Map(
      (existing || []).map((e: any) => [e.sale_type_id, e] as [number, any])
    );

    const mapped: SaleChannel[] = [];
    const preSelected = new Set<number>();

    for (const ch of channels as any[]) {
      const record = existingMap.get(ch.id) as any;
      if (record) {
        if (isEditing && record.tax_serie_id === parseInt(serieId!)) {
          mapped.push({ id: ch.id, name: ch.name, code: ch.code, linked: true });
          preSelected.add(ch.id);
        }
      } else {
        mapped.push({ id: ch.id, name: ch.name, code: ch.code, linked: false });
      }
    }

    setSaleChannels(mapped);
    setSelectedChannelIds(preSelected);
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
    fetchSaleChannels();
    if (isEditing) fetchSerie();
  }, [fetchDropdowns, fetchSaleChannels, fetchSerie, isEditing]);

  const updateField = (field: keyof InvoiceSerieForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChannel = (id: number) => {
    setSelectedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveSaleChannelLinks = async (newSerieId: number) => {
    // Delete existing links for this serie
    await (supabase as any)
      .from("sale_type_invoice_series")
      .delete()
      .eq("tax_serie_id", newSerieId);

    // Insert selected channels
    const toInsert = Array.from(selectedChannelIds).map((saleTypeId) => ({
      sale_type_id: saleTypeId,
      tax_serie_id: newSerieId,
    }));

    if (toInsert.length > 0) {
      const { error } = await (supabase as any)
        .from("sale_type_invoice_series")
        .insert(toInsert);
      if (error) throw error;
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

      await saveSaleChannelLinks(savedSerieId);

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
    saleChannels,
    selectedChannelIds,
    loading,
    saving,
    isEditing,
    updateField,
    toggleChannel,
    saveSerie,
  };
};
