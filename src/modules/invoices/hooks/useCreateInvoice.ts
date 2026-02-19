import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createInvoiceApi } from "../services/Invoices.services";
import { getTypes } from "@/shared/services/service";
import { getTypesAdapter } from "@/shared/adapters/adapter";
import type { Types } from "@/shared/types/type";
import type { InvoiceItemForm, InvoiceFormData, DocumentType, InvoiceProvider, InvoiceSerie } from "../types/Invoices.types";

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
  invoiceProviderId: "",
  invoiceSerieId: "",
  taxSerie: "",
  documentTypeId: "",
  clientDocument: "",
  clientName: "",
  clientEmail: "",
  clientAddress: "",
};

export const useCreateInvoice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<InvoiceFormData>(INITIAL_FORM);
  const [items, setItems] = useState<InvoiceItemForm[]>([createEmptyItem()]);
  const [saving, setSaving] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [invoiceTypes, setInvoiceTypes] = useState<Types[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [invoiceProviders, setInvoiceProviders] = useState<InvoiceProvider[]>([]);
  const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSerie[]>([]);

  // Load invoice types, document types, and providers on mount
  useEffect(() => {
    const loadData = async () => {
      const typesResponse = await getTypes("INV");
      setInvoiceTypes(getTypesAdapter(typesResponse));

      const { data } = await supabase
        .from("document_types")
        .select("id, name, code, person_type")
        .order("id");
      if (data) {
        setDocumentTypes(
          data.map((d) => ({
            id: d.id,
            name: d.name,
            code: d.code || "",
            personType: d.person_type,
          }))
        );
      }

      const { data: providers } = await supabase
        .from("invoice_providers")
        .select("id, description")
        .order("id");
      if (providers) {
        setInvoiceProviders(providers);
      }
    };
    loadData();
  }, []);

  // Load series when provider changes
  useEffect(() => {
    const loadSeries = async () => {
      if (!formData.invoiceProviderId) {
        setInvoiceSeries([]);
        return;
      }
      const { data } = await supabase
        .from("invoice_series")
        .select("id, fac_serie, bol_serie, ncf_serie, ncb_serie, ndb_serie, ndf_serie, grr_serie, grt_serie, next_number")
        .eq("invoice_provider_id", parseInt(formData.invoiceProviderId))
        .eq("is_active", true)
        .order("id");
      if (data) {
        setInvoiceSeries(data);
      }
    };
    loadSeries();
  }, [formData.invoiceProviderId]);
  const totalAmount = useMemo(
    () => +items.reduce((sum, i) => sum + i.total, 0).toFixed(2),
    [items]
  );

  const handleFormChange = useCallback(
    (field: keyof InvoiceFormData, value: string) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        // Reset dependent fields
        if (field === "invoiceProviderId") {
          updated.invoiceSerieId = "";
          updated.taxSerie = "";
        }
        return updated;
      });
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

  // Search client by document type + number
  const searchClient = useCallback(async () => {
    const doc = formData.clientDocument;
    const docTypeId = formData.documentTypeId;
    if (!doc || doc.length < 3 || !docTypeId) {
      toast({ title: "Ingresa tipo y número de documento", variant: "destructive" });
      return;
    }

    setSearchingClient(true);
    try {
      // First check if account exists in DB
      const { data: account } = await supabase
        .from("accounts")
        .select("id, name, last_name, document_number")
        .eq("document_number", doc)
        .eq("document_type_id", parseInt(docTypeId))
        .limit(1)
        .single();

      if (account) {
        setFormData((prev) => ({
          ...prev,
          clientName: [account.name, account.last_name].filter(Boolean).join(" "),
        }));
        return;
      }

      // If not found, try document-lookup API
      const selectedDocType = documentTypes.find((d) => d.id.toString() === docTypeId);
      if (selectedDocType) {
        const { data: lookupData, error: lookupError } = await supabase.functions.invoke(
          `document-lookup?document_type=${selectedDocType.code}&document_number=${doc}`,
          { method: "GET" }
        );

        if (!lookupError && lookupData) {
          const name = lookupData.razon_social || 
            [lookupData.nombres, lookupData.apellidoPaterno, lookupData.apellidoMaterno].filter(Boolean).join(" ");
          setFormData((prev) => ({
            ...prev,
            clientName: name || "No encontrado",
          }));
          if (name) {
            toast({ title: "Cliente encontrado vía consulta externa (no registrado en sistema)" });
          }
          return;
        }
      }

      toast({ title: "Cliente no encontrado", variant: "destructive" });
      setFormData((prev) => ({ ...prev, clientName: "" }));
    } catch {
      toast({ title: "Error buscando cliente", variant: "destructive" });
    } finally {
      setSearchingClient(false);
    }
  }, [formData.clientDocument, formData.documentTypeId, documentTypes, toast]);

  const handleSave = useCallback(async () => {
    if (!formData.invoiceTypeId || !formData.documentTypeId || !formData.clientDocument) {
      toast({ title: "Completa tipo de comprobante, tipo de documento y número de documento", variant: "destructive" });
      return;
    }
    if (items.some((i) => !i.description || i.quantity <= 0 || i.unitPrice <= 0)) {
      toast({ title: "Completa todos los items correctamente", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const totalTaxes = +items.reduce((s, i) => s + i.igv, 0).toFixed(2);

      await createInvoiceApi({
        invoice_type_id: parseInt(formData.invoiceTypeId),
        tax_serie: formData.taxSerie || undefined,
        customer_document_type_id: parseInt(formData.documentTypeId),
        customer_document_number: formData.clientDocument,
        client_name: formData.clientName || undefined,
        client_email: formData.clientEmail || undefined,
        client_address: formData.clientAddress || undefined,
        total_amount: totalAmount,
        total_taxes: totalTaxes,
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
    documentTypes,
    invoiceProviders,
    invoiceSeries,
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
