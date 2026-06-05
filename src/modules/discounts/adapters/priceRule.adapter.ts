import type {
  PriceRule,
  PriceRuleFormData,
  PriceRulePagination,
  ConditionsConfig,
} from "../types/priceRule.types";
import { limaDateTimeLocalToIso, LIMA_TIME_ZONE } from "@/shared/utils/date";

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
function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// ISO (con o sin timezone) → "YYYY-MM-DDTHH:mm" en hora Lima, listo para <input type="datetime-local">.
export function isoToDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const y = get("year");
  const m = get("month");
  const d = get("day");
  const hh = pad(Number(get("hour")));
  const mm = pad(Number(get("minute")));
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

// "YYYY-MM-DDTHH:mm" (asumido en hora Lima) → ISO 8601 con offset -05:00, o "" si vacío.
// El backend interpreta "" como NULL, así que conservamos string para mantener la forma del tipo PriceRuleFormData.
export function dateTimeLocalToISO(local: string | null | undefined): string {
  return limaDateTimeLocalToIso(local);
}

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
    valid_from: isoToDateTimeLocal(rule.valid_from),
    valid_to: isoToDateTimeLocal(rule.valid_to),
    price_list_id: rule.price_list_id,
    conditions: rule.conditions || DEFAULT_CONDITIONS,
    actions: rule.actions || [],
    coupon_code: coupon?.code || "",
    max_uses: coupon?.max_uses ?? null,
    max_uses_per_customer: coupon?.max_uses_per_customer ?? null,
  };
}

// Convierte el formData del formulario al payload que esperan las edge functions
// (fechas en ISO con offset Lima en vez del formato datetime-local).
export function adaptFormToPayload(formData: PriceRuleFormData): PriceRuleFormData {
  return {
    ...formData,
    valid_from: dateTimeLocalToISO(formData.valid_from),
    valid_to: dateTimeLocalToISO(formData.valid_to),
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
