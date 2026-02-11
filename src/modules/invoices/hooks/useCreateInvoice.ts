import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createInvoiceApi } from "../services/Invoices.services";
import type { InvoiceItemForm, InvoiceFormData } from "../types/Invoices.types";

const createEmptyItem = (): InvoiceItemForm => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  measurementUnit: "NIU",
  unitPrice: 0,
  discount: 0,
  igv: 0,
  total: 0,
});

const recalcItem = (item: InvoiceItemForm): InvoiceItemForm => {
  const base = item.quantity * item.unitPrice;
  const baseWithDiscount = base - (item.discount || 0);
  const igv = +(baseWithDiscount * 0.18).toFixed(2);
  const total = +(baseWithDiscount + igv).toFixed(2);
  return { ...item, igv, total };
};

const INITIAL_FORM: InvoiceFormData = {
  invoiceTypeId: "",
  serie: "",
  accountId: "",
  clientName: "",
  clientDocument: "",
};

export const useCreateInvoice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<InvoiceFormData>(INITIAL_FORM);
  const [items, setItems] = useState<InvoiceItemForm[]>([createEmptyItem()]);
  const [saving, setSaving] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);

  // Invoice types (hardcoded from DB)
  const invoiceTypes = [
    { id: "34", name: "Boleta" },
    { id: "36", name: "Factura" },
  ];

  const totalAmount = useMemo(
    () => +items.reduce((sum, i) => sum + i.total, 0).toFixed(2),
    [items]
  );

  const handleFormChange = useCallback(
    (field: keyof InvoiceFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.id !== id)));
  }, []);

  const updateItem = useCallback(
    (id: string, field: keyof InvoiceItemForm, value: string | number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, [field]: value };
          if (["quantity", "unitPrice", "discount"].includes(field)) {
            return recalcItem(updated);
          }
          return updated;
        })
      );
    },
    []
  );

  // Search client by document number
  const searchClient = useCallback(async (doc: string) => {
    if (!doc || doc.length < 3) return;
    setSearchingClient(true);
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, last_name, document_number")
        .eq("document_number", doc)
        .limit(1)
        .single();

      if (error || !data) {
        toast({ title: "Cliente no encontrado", variant: "destructive" });
        setFormData((prev) => ({ ...prev, accountId: "", clientName: "" }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        accountId: data.id.toString(),
        clientName: [data.name, data.last_name].filter(Boolean).join(" "),
        clientDocument: data.document_number,
      }));
    } catch {
      toast({ title: "Error buscando cliente", variant: "destructive" });
    } finally {
      setSearchingClient(false);
    }
  }, [toast]);

  const handleSave = useCallback(async () => {
    // Validations
    if (!formData.invoiceTypeId || !formData.accountId) {
      toast({ title: "Completa tipo de comprobante y cliente", variant: "destructive" });
      return;
    }
    if (items.some((i) => !i.description || i.quantity <= 0 || i.unitPrice <= 0)) {
      toast({ title: "Completa todos los items correctamente", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await createInvoiceApi({
        invoice_type_id: parseInt(formData.invoiceTypeId),
        serie: formData.serie,
        account_id: parseInt(formData.accountId),
        total_amount: totalAmount,
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          measurement_unit: i.measurementUnit,
          unit_price: i.unitPrice,
          discount: i.discount,
          igv: i.igv,
          total: i.total,
        })),
      });
      toast({ title: "Comprobante creado exitosamente" });
      navigate("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ title: "Error al crear comprobante", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [formData, items, totalAmount, navigate, toast]);

  return {
    formData,
    items,
    saving,
    searchingClient,
    invoiceTypes,
    totalAmount,
    handleFormChange,
    addItem,
    removeItem,
    updateItem,
    searchClient,
    handleSave,
    navigate,
  };
};
