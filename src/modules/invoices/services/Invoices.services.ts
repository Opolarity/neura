import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { InvoiceFilters, CreateInvoicePayload } from "../types/Invoices.types";

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
