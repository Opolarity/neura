import type {
  PriceRule,
  PriceRuleFormData,
  PriceRulePagination,
  ConditionsConfig,
} from "../types/priceRule.types";

export const DEFAULT_CONDITIONS: ConditionsConfig = {
  operator: "AND",
  groups: [
    {
      operator: "AND",
      conditions: [],
    },
  ],
};

export const DEFAULT_FORM_DATA: PriceRuleFormData = {
  name: "",
  description: "",
  code: "",
  rule_type: "automatic",
  priority: 100,
  is_stackable: true,
  stop_processing: true,
  is_active: true,
  valid_from: "",
  valid_to: "",
  price_list_id: null,
  conditions: DEFAULT_CONDITIONS,
  actions: [],
  coupon_code: "",
  max_uses: null,
  max_uses_per_customer: null,
};

export function adaptPriceRuleToForm(rule: PriceRule): PriceRuleFormData {
  const coupon = rule.discounts?.[0];

  return {
    name: rule.name,
    description: rule.description || "",
    code: rule.code || "",
    rule_type: rule.rule_type,
    priority: rule.priority,
    is_stackable: rule.is_stackable,
    stop_processing: rule.stop_processing,
    is_active: rule.is_active,
    valid_from: rule.valid_from || "",
    valid_to: rule.valid_to || "",
    price_list_id: rule.price_list_id,
    conditions: rule.conditions || DEFAULT_CONDITIONS,
    actions: rule.actions || [],
    coupon_code: coupon?.code || "",
    max_uses: coupon?.max_uses ?? null,
    max_uses_per_customer: coupon?.max_uses_per_customer ?? null,
  };
}

export function adaptPriceRulesListResponse(response: any): {
  rules: PriceRule[];
  pagination: PriceRulePagination;
} {
  return {
    rules: response.data ?? [],
    pagination: response.page ?? {
      current: 1,
      size: 20,
      total: 0,
      total_pages: 0,
    },
  };
}
