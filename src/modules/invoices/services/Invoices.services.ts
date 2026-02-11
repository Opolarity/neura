import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { InvoiceFilters } from "../types/Invoices.types";

export const getInvoicesApi = async (filters: InvoiceFilters) => {
  const endpoint = buildEndpoint("get-invoices", filters);
  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  return data;
};
