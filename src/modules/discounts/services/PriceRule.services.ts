import type {
  FranchiseeAccount,
  PriceRuleFormData,
  PriceRuleFilters,
} from "../types/priceRule.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getPriceRules = async (filters: PriceRuleFilters) => {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("size", String(filters.size));
  if (filters.search) params.set("search", filters.search);
  if (filters.rule_type) params.set("rule_type", filters.rule_type);
  if (filters.is_active !== null) params.set("is_active", filters.is_active);
  if (filters.price_list_id) params.set("price_list_id", filters.price_list_id);

  const data = await invokeFunction(
    `get-price-rules?${params.toString()}`,
    { method: "GET" }
  );
  return data;
};

export const getPriceRuleDetails = async (id: number) => {
  const data = await invokeFunction(
    `get-price-rule-details?id=${id}`,
    { method: "GET" }
  );
  return data;
};

export const createPriceRule = async (rule: PriceRuleFormData) => {
  const data = await invokeFunction("create-price-rule", {
    body: rule,
  });
  return data;
};

export const updatePriceRule = async (id: number, rule: Partial<PriceRuleFormData>) => {
  const data = await invokeFunction("update-price-rule", {
    body: { id, ...rule },
  });
  return data;
};

export const updateBulkPriceRule = async (ruleIds: number[], isActive: boolean) => {
  const data = await invokeFunction("bulk-update-price-rule-status", {
    body: { ruleIds, isActive },
  });
  return data;
};

export const deletePriceRule = async (id: number) => {
  const data = await invokeFunction("delete-price-rule", {
    body: { id },
  });
  return data;
};

// Cuentas franquiciadas activas (accounts con tenant_reference), para el
// selector de franquiciados de las promociones de consignación.
export const getFranchiseeAccounts = async (): Promise<FranchiseeAccount[]> => {
  const data = await invokeFunction(
    "get-franchisee-accounts",
    { method: "GET" }
  );
  return (data?.data ?? []) as FranchiseeAccount[];
};

export const deletePriceRulesBulk = async (ruleIds: number[]) => {
  const data = await invokeFunction("delete-massive-price-rules", {
    body: { ruleIds },
  });
  return data as {
    success: boolean;
    requested: number;
    deleted: number;
    deletedIds: number[];
    alreadyDeletedIds: number[];
    notFoundIds: number[];
  };
};
