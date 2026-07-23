import { supabase } from "@/integrations/supabase/client";
import type { PriceRuleFormData, PriceRuleFilters } from "../types/priceRule.types";

const throwFunctionError = async (error: unknown): Promise<never> => {
  const functionError = error as { context?: unknown; message?: string };

  if (functionError.context instanceof Response) {
    let body: { error?: unknown; message?: unknown; details?: unknown } | null = null;
    try {
      body = await functionError.context.json();
    } catch {
      body = null;
    }

    const message = body?.error || body?.message || body?.details;
    if (message) {
      throw new Error(String(message));
    }
  }

  if (error instanceof Error) throw error;
  throw new Error("Error desconocido al llamar la función");
};

export const getPriceRules = async (filters: PriceRuleFilters) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.search) params.set("search", filters.search);
  if (filters.rule_type) params.set("rule_type", filters.rule_type);
  if (filters.is_active !== null) params.set("is_active", filters.is_active);
  if (filters.price_list_id) params.set("price_list_id", filters.price_list_id);

  const { data, error } = await supabase.functions.invoke(
    `get-price-rules?${params.toString()}`,
    { method: "GET" }
  );
  if (error) await throwFunctionError(error);
  return data;
};

export const getPriceRuleDetails = async (id: number) => {
  const { data, error } = await supabase.functions.invoke(
    `get-price-rule-details?id=${id}`,
    { method: "GET" }
  );
  if (error) await throwFunctionError(error);
  return data;
};

export const createPriceRule = async (rule: PriceRuleFormData) => {
  const { data, error } = await supabase.functions.invoke("create-price-rule", {
    body: rule,
  });
  if (error) await throwFunctionError(error);
  return data;
};

export const updatePriceRule = async (id: number, rule: Partial<PriceRuleFormData>) => {
  const { data, error } = await supabase.functions.invoke("update-price-rule", {
    body: { id, ...rule },
  });
  if (error) await throwFunctionError(error);
  return data;
};

export const updateBulkPriceRule = async (ruleIds: number[], isActive: boolean) => {
  const { data, error } = await supabase.functions.invoke("bulk-update-price-rule-status", {
    body: { ruleIds, isActive },
  });
  if (error) await throwFunctionError(error);
  return data;
};

export const deletePriceRule = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("delete-price-rule", {
    body: { id },
  });
  if (error) await throwFunctionError(error);
  return data;
};
