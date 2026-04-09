import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { InvoiceFilters, CreateInvoicePayload, UpdateInvoicePayload } from "../types/Invoices.types";

export const getInvoicesApi = async (filters: InvoiceFilters) => {
  const endpoint = buildEndpoint("get-invoices", filters);
  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  return data;
};

export const createInvoiceApi = async (payload: CreateInvoicePayload) => {
  const { data, error } = await supabase.functions.invoke("create-invoice", {
    method: "POST",
    body: payload,
  });

  if (error) throw error;
  return data;
};

export const getOrderInvoices = async (orderId: number) => {
  const { data, error } = await supabase
    .from("order_invoices")
    .select(`
      invoice_id,
      invoices (
        id,
        invoice_number,
        invoice_type_id,
        invoices_types:invoice_type_id (
          id,
          name,
          code
        )
      )
    `)
    .eq("order_id", orderId);

  if (error) throw error;
  return data || [];
};

export const getMovementInvoices = async (movementId: number) => {
  const { data, error } = await supabase
    .from("movement_invoices")
    .select(`
      invoice_id,
      invoices (
        id,
        invoice_number,
        invoice_type_id,
        invoices_types:invoice_type_id (
          id,
          name,
          code
        )
      )
    `)
    .eq("movement_id", movementId);

  if (error) throw error;
  return data || [];
};

export const getListOrdersApi = async (params: { page: number; size: number; search?: string }) => {
  const urlParams = new URLSearchParams();
  urlParams.append("page", params.page.toString());
  urlParams.append("size", params.size.toString());
  if (params.search) urlParams.append("search", params.search);

  const { data, error } = await supabase.functions.invoke(`get-sales-list?${urlParams.toString()}`, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

export const getListMovementsApi = async (params: { page: number; size: number; search?: string }) => {
  const urlParams = new URLSearchParams();
  urlParams.append("page", params.page.toString());
  urlParams.append("size", params.size.toString());
  if (params.search) urlParams.append("search", params.search);

  const { data, error } = await supabase.functions.invoke(`get-movements?${urlParams.toString()}`, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

export const updateInvoiceApi = async (payload: UpdateInvoicePayload) => {
  const { data, error } = await supabase.functions.invoke("update-invoice", {
    method: "PUT",
    body: payload,
  });

  if (error) throw error;
  return data;
};

export const getInvoiceFormDataApi = async (params: { invoiceId?: number; orderId?: number; movementId?: number }) => {
  const urlParams = new URLSearchParams();
  if (params.invoiceId) urlParams.append("invoice_id", params.invoiceId.toString());
  if (params.orderId) urlParams.append("order_id", params.orderId.toString());
  if (params.movementId) urlParams.append("movement_id", params.movementId.toString());

  const { data, error } = await supabase.functions.invoke(`get-form-data-invoice?${urlParams.toString()}`, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};