import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { InvoiceFilters } from "../types/Invoices.types";

export const getInvoicesApi = (filters: InvoiceFilters) => {
  const endpoint = buildEndpoint("get-invoices", filters);
  const { data, error } = supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  return data;
};
