import { supabase } from "@/integrations/supabase/client";
import type { PriceRuleFormData, PriceRuleFilters } from "../types/priceRule.types";

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
  if (error) throw error;
  return data;
};

export const getPriceRuleDetails = async (id: number) => {
  const { data, error } = await supabase.functions.invoke(
    `get-price-rule-details?id=${id}`,
    { method: "GET" }
  );
  if (error) throw error;
  return data;
};

export const createPriceRule = async (rule: PriceRuleFormData) => {
  const { data, error } = await supabase.functions.invoke("create-price-rule", {
    body: rule,
  });
  if (error) throw error;
  return data;
};

export const updatePriceRule = async (id: number, rule: Partial<PriceRuleFormData>) => {
  const { data, error } = await supabase.functions.invoke("update-price-rule", {
    body: { id, ...rule },
  });
  if (error) throw error;
  return data;
};

export const deletePriceRule = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("delete-price-rule", {
    body: { id },
  });
  if (error) throw error;
  return data;
};
