import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { InvoiceFilters, CreateInvoicePayload, UpdateInvoicePayload, InvoicesResponse } from "../types/Invoices.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getInvoicesApi = async (filters: InvoiceFilters): Promise<InvoicesResponse> => {
  const endpoint = buildEndpoint("get-invoices", filters);
  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return data;
};

export const createInvoiceApi = async (payload: CreateInvoicePayload) => {
  const data = await invokeFunction("create-invoice", {
    method: "POST",
    body: payload,
  });
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

export const getMovementOrderLink = async (movementId: number) => {
  const { data, error } = await supabase
    .from("order_payment")
    .select("order_id")
    .eq("movement_id", movementId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getListOrdersApi = async (params: { page: number; size: number; search?: string }) => {
  const urlParams = new URLSearchParams();
  urlParams.append("page", params.page.toString());
  urlParams.append("size", params.size.toString());
  if (params.search) urlParams.append("search", params.search);

  const data = await invokeFunction(`get-sales-list?${urlParams.toString()}`, {
    method: "GET",
  });
  return data;
};

export const getListMovementsApi = async (params: { page: number; size: number; search?: string }) => {
  const urlParams = new URLSearchParams();
  urlParams.append("page", params.page.toString());
  urlParams.append("size", params.size.toString());
  if (params.search) urlParams.append("search", params.search);

  const data = await invokeFunction(`get-movements?${urlParams.toString()}`, {
    method: "GET",
  });
  return data;
};

export const updateInvoiceApi = async (payload: UpdateInvoicePayload) => {
  const data = await invokeFunction("update-invoice", {
    method: "PUT",
    body: payload,
  });
  return data;
};

export const getInvoiceTypesApi = async () => {
  const { data: moduleData, error: moduleError } = await supabase
    .from("modules")
    .select("id")
    .eq("code", "INV")
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await supabase
    .from("types")
    .select("id, name, code")
    .eq("module_id", moduleData.id)
    .order("name");

  if (error) throw error;
  return data || [];
};

export const getInvoiceFormDataApi = async (params: { invoiceId?: number; orderId?: number; movementId?: number; paymentId?: number }) => {
  const urlParams = new URLSearchParams();
  if (params.invoiceId) urlParams.append("invoice_id", params.invoiceId.toString());
  if (params.orderId) urlParams.append("order_id", params.orderId.toString());
  if (params.movementId) urlParams.append("movement_id", params.movementId.toString());
  if (params.paymentId) urlParams.append("payment_id", params.paymentId.toString());

  const data = await invokeFunction(`get-form-data-invoice?${urlParams.toString()}`, {
    method: "GET",
  });
  return data;
};