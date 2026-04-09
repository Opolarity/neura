import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createInvoiceApi, updateInvoiceApi, getInvoiceFormDataApi } from "../services/Invoices.services";
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
  orderId: "",
  movementId: "",
};

export const useCreateInvoice = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { toast } = useToast();
  const isEditing = !!invoiceId;

  const [formData, setFormData] = useState<InvoiceFormData>(INITIAL_FORM);
  const [items, setItems] = useState<InvoiceItemForm[]>([createEmptyItem()]);
  const [saving, setSaving] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [xmlUrl, setXmlUrl] = useState<string | null>(null);
  const [cdrUrl, setCdrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [invoiceTypes, setInvoiceTypes] = useState<Types[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [invoiceProviders, setInvoiceProviders] = useState<InvoiceProvider[]>([]);
  const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSerie[]>([]);

  // 1. Load generic data (dropdowns) on mount
  useEffect(() => {
    const loadGenericData = async () => {
      try {
        const typesResponse = await getTypes("INV");
        setInvoiceTypes(getTypesAdapter(typesResponse));

        const { data: docs } = await supabase
          .from("document_types")
          .select("id, name, code, person_type")
          .order("id");
        if (docs) {
          setDocumentTypes(docs.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code || "",
            personType: d.person_type,
          })));
        }

        const { data: providers } = await supabase
          .from("invoice_providers")
          .select("id, description")
          .order("id");
        if (providers) {
          setInvoiceProviders(providers);
        }
      } catch (error) {
        console.error("Error loading generic data:", error);
      }
    };
    loadGenericData();
  }, []);

  // 2. Load series dynamically when provider changes
  useEffect(() => {
    const loadSeries = async () => {
      if (!formData.invoiceProviderId) {
        setInvoiceSeries([]);
        return;
      }
      const { data: series } = await supabase
        .from("invoice_series")
        .select("id, invoice_type_id, serie, next_number, invoice_provider_id")
        .eq("invoice_provider_id", parseInt(formData.invoiceProviderId))
        .eq("is_active", true)
        .order("id");
      if (series) {
        setInvoiceSeries(series as any);
      }
    };
    loadSeries();
  }, [formData.invoiceProviderId]);

  // 3. Load specific record data (Edit or from Order)
  useEffect(() => {
    const orderIdFromUrl = new URLSearchParams(window.location.search).get("orderId");
    if (!invoiceId && !orderIdFromUrl) return;

    const loadSpecificData = async () => {
      setLoading(true);
      try {
        const data = await getInvoiceFormDataApi({
          invoiceId: invoiceId ? parseInt(invoiceId) : undefined,
          orderId: orderIdFromUrl ? parseInt(orderIdFromUrl) : undefined,
          movementId: new URLSearchParams(window.location.search).get("movementId") ? parseInt(new URLSearchParams(window.location.search).get("movementId")!) : undefined
        });

        // 3.1. Set Invoice Data (Edit Mode)
        if (data.invoice) {
          const invoice = data.invoice;
          setDeclared(invoice.declared || false);
          setPdfUrl(invoice.pdf_url || null);
          setXmlUrl(invoice.xml_url || null);
          setCdrUrl(invoice.cdr_url || null);

          // We'll need to find the provider/serie after the dropdowns are loaded (handled by effect)
          // But we can set the IDs directly if we have them or let the dropdown data trigger the match
          // Wait, if we set them here, we ensure they are selected once series load
          setFormData(prev => ({
            ...prev,
            invoiceTypeId: invoice.invoice_type_id.toString(),
            taxSerie: invoice.tax_serie || "",
            documentTypeId: invoice.customer_document_type_id?.toString() || "",
            clientDocument: invoice.customer_document_number || "",
            clientName: invoice.client_name || "",
            clientEmail: invoice.client_email || "",
            clientAddress: invoice.client_address || "",
            orderId: data.order?.id?.toString() || "",
            movementId: data.movement?.id?.toString() || "",
          }));

          // Try to determine provider from tax_serie if possible
          if (invoice.tax_serie) {
            const seriePrefix = invoice.tax_serie.split("-")[0];
            const { data: sData } = await supabase
              .from("invoice_series")
              .select("id, invoice_provider_id")
              .eq("serie", seriePrefix)
              .maybeSingle();

            if (sData) {
              setFormData(prev => ({
                ...prev,
                invoiceProviderId: sData.invoice_provider_id.toString(),
                invoiceSerieId: sData.id.toString()
              }));
            }
          }

          if (data.items && data.items.length > 0) {
            setItems(data.items.map((item: any) => ({
              id: item.id.toString(),
              description: item.description,
              quantity: item.quantity,
              measurementUnit: item.measurement_unit,
              unitPrice: item.unit_price,
              discount: item.discount || 0,
              igv: item.igv,
              total: item.total,
            })));
          }
        }

        // 3.2. Set Order Data (Creation from Order)
        if (data.order && !data.invoice) {
          const order = data.order;
          const orderProducts = data.orderProducts || [];

          const existingInvoices = data.existingOrderInvoices || [];
          const hasFinalizedInvoice = existingInvoices.some((ei: any) =>
            ei.invoices?.invoices_types?.code === "1" || ei.invoices?.invoices_types?.code === "2"
          );

          if (hasFinalizedInvoice) {
            toast({
              title: "Bloqueo: Pedido ya facturado legalmente",
              description: "Este pedido ya cuenta con una Boleta o Factura. No se permite crear otro comprobante legal por esta vía.",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }

          setFormData(prev => ({
            ...prev,
            clientName: [order.customer_name, order.customer_lastname].filter(Boolean).join(" "),
            clientEmail: order.email || "",
            clientAddress: order.address || "",
            clientDocument: order.document_number || "",
            orderId: order.id.toString(),
            // Match document type ID locally once loaded
          }));

          if (orderProducts.length > 0) {
            setItems(orderProducts.map((p: any) => {
              const unitPrice = parseFloat(p.product_price) || 0;
              const quantity = p.quantity || 1;
              const discount = parseFloat(p.product_discount) || 0;
              const base = quantity * unitPrice;
              const baseWithDiscount = base - discount;
              const igv = +(baseWithDiscount * 0.18).toFixed(2);
              const total = +(baseWithDiscount + igv).toFixed(2);

              return {
                id: crypto.randomUUID(),
                description: p.product_title || p.product_name || "Producto",
                quantity,
                measurementUnit: "NIU",
                unitPrice,
                discount,
                igv,
                total,
              };
            }));
          }
          toast({ title: "Datos del pedido cargados correctamente" });
        }

        // 3.3. Set Movement Data (Creation from Movement)
        if (data.movement && !data.invoice) {
          const movement = data.movement;
          setFormData(prev => ({
            ...prev,
            clientName: "", // Movements don't always have a client name attached in the same way
            clientEmail: "",
            clientAddress: "",
            clientDocument: "",
            movementId: movement.id.toString(),
          }));
          
          setItems([{
            id: crypto.randomUUID(),
            description: movement.description || "Movimiento",
            quantity: 1,
            measurementUnit: "ZZ",
            unitPrice: movement.amount || 0,
            discount: 0,
            igv: +((movement.amount || 0) * 0.18).toFixed(2),
            total: +((movement.amount || 0) * 1.18).toFixed(2),
          }]);
          
          toast({ title: "Datos del movimiento cargados correctamente" });
        }
      } catch (error) {
        console.error("Error loading record data:", error);
        toast({ title: "Error al cargar datos", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadSpecificData();
  }, [invoiceId, toast]);
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

  const loadOrderData = useCallback(async (orderId: number) => {
    setLoading(true);
    try {
      const data = await getInvoiceFormDataApi({ orderId });

      if (!data.order) {
        toast({ title: "Pedido no encontrado", variant: "destructive" });
        return;
      }

      const order = data.order;
      const orderProducts = data.orderProducts || [];
      const existingInvoices = data.existingOrderInvoices || [];

      // Check if order already has invoices
      const hasFinalizedInvoice = existingInvoices.some((ei: any) =>
        ei.invoices?.invoices_types?.code === "1" || ei.invoices?.invoices_types?.code === "2"
      );

      if (hasFinalizedInvoice) {
        toast({
          title: "Atención: Pedido ya facturado",
          description: "Este pedido ya tiene una Boleta o Factura asociada, pero puedes vincularlo si es necesario.",
          variant: "destructive"
        });
      }

      // Populate form data
      setFormData(prev => ({
        ...prev,
        clientName: [order.customer_name, order.customer_lastname].filter(Boolean).join(" "),
        clientEmail: order.email || "",
        clientAddress: order.address || "",
        clientDocument: order.document_number || "",
        orderId: orderId.toString(),
        documentTypeId: data.order?.document_type_id?.toString() || "",
      }));

      // Populate items
      if (orderProducts.length > 0) {
        setItems(orderProducts.map((p: any) => {
          const unitPrice = p.price || 0;
          const quantity = p.quantity || 1;
          const discount = p.discount_amount || 0;
          const base = quantity * unitPrice;
          const baseWithDiscount = base - discount;
          const igv = +(baseWithDiscount * 0.18).toFixed(2);
          const total = +(baseWithDiscount + igv).toFixed(2);

          return {
            id: crypto.randomUUID(),
            description: p.product_title || p.product_name || "Producto",
            quantity,
            measurementUnit: "NIU",
            unitPrice,
            discount,
            igv,
            total,
          };
        }));
      }

      toast({ title: "Datos del pedido cargados correctamente" });
    } catch (error: any) {
      console.error("Error loading order data:", error);
      toast({ title: "Error al cargar datos del pedido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
    const selectedType = invoiceTypes.find((t) => t.id.toString() === formData.invoiceTypeId);
    const isBoleta = selectedType?.code === "2";
    const isLowAmountBoleta = isBoleta && totalAmount < 700;

    if (!formData.invoiceTypeId || (!isLowAmountBoleta && (!formData.documentTypeId || !formData.clientDocument))) {
      const title = isBoleta && totalAmount >= 700
        ? "Para boletas de 700 a más es obligatorio el tipo y número de documento"
        : "Completa tipo de comprobante, tipo de documento y número de documento";

      toast({ title, variant: "destructive" });
      return;
    }
    if (items.some((i) => !i.description || i.quantity <= 0 || i.unitPrice <= 0)) {
      toast({ title: "Completa todos los items correctamente", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const totalTaxes = +items.reduce((s, i) => s + i.igv, 0).toFixed(2);

      if (isEditing && invoiceId) {
        // Update invoice via edge function
        await updateInvoiceApi({
          id: parseInt(invoiceId),
          invoice_type_id: parseInt(formData.invoiceTypeId),
          tax_serie: formData.taxSerie || undefined,
          customer_document_type_id: formData.documentTypeId ? parseInt(formData.documentTypeId) : null,
          customer_document_number: formData.clientDocument || "",
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
          order_id: formData.orderId ? parseInt(formData.orderId) : undefined,
          movement_id: formData.movementId ? parseInt(formData.movementId) : undefined,
        });

        toast({ title: "Comprobante actualizado exitosamente" });
      } else {
        await createInvoiceApi({
          invoice_type_id: parseInt(formData.invoiceTypeId),
          tax_serie: formData.taxSerie || undefined,
          customer_document_type_id: formData.documentTypeId ? parseInt(formData.documentTypeId) : null as any,
          customer_document_number: formData.clientDocument || "",
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
          order_id: formData.orderId ? parseInt(formData.orderId) : undefined,
          movement_id: formData.movementId ? parseInt(formData.movementId) : undefined,
        });
        toast({ title: "Comprobante creado exitosamente" });
      }
      navigate("/invoices");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({ title: isEditing ? "Error al actualizar comprobante" : "Error al crear comprobante", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [formData, items, totalAmount, navigate, toast, isEditing, invoiceId, invoiceTypes]);

  const handleEmit = useCallback(async () => {
    if (!invoiceId) return;
    setEmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("emit-invoice", {
        method: "POST",
        body: { invoice_id: parseInt(invoiceId) },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }

      setDeclared(true);
      if (data?.pdf_url) setPdfUrl(data.pdf_url);
      if (data?.xml_url) setXmlUrl(data.xml_url);
      if (data?.cdr_url) setCdrUrl(data.cdr_url);
      toast({
        title: "Comprobante emitido en SUNAT",
        description: data?.sunat_description || "Emitido correctamente",
      });
    } catch (error: any) {
      console.error("Error emitting invoice:", error);
      toast({ title: error?.message || "Error al emitir en SUNAT", variant: "destructive" });
    } finally {
      setEmitting(false);
    }
  }, [invoiceId, toast]);

  return {
    formData,
    items,
    saving,
    emitting,
    loading,
    isEditing,
    declared,
    pdfUrl,
    xmlUrl,
    cdrUrl,
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
    loadOrderData,
    handleSave,
    handleEmit,
    navigate,
    invoiceId,
  };
};
