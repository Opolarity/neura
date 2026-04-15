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
// Proyecto opera en hora Lima (UTC-5). Los inputs datetime-local no manejan
// timezone, así que convertimos manualmente al cargar y al enviar.
const LIMA_OFFSET_MINUTES = -5 * 60; // UTC-5
const LIMA_OFFSET_STRING = "-05:00";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// ISO (con o sin timezone) → "YYYY-MM-DDTHH:mm" en hora Lima, listo para <input type="datetime-local">.
export function isoToDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  // Convertir UTC → Lima sumando el offset (negativo).
  const lima = new Date(date.getTime() + LIMA_OFFSET_MINUTES * 60 * 1000);
  const y = lima.getUTCFullYear();
  const m = pad(lima.getUTCMonth() + 1);
  const d = pad(lima.getUTCDate());
  const hh = pad(lima.getUTCHours());
  const mm = pad(lima.getUTCMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

// "YYYY-MM-DDTHH:mm" (asumido en hora Lima) → ISO 8601 con offset -05:00, o "" si vacío.
// El backend interpreta "" como NULL, así que conservamos string para mantener la forma del tipo PriceRuleFormData.
export function dateTimeLocalToISO(local: string | null | undefined): string {
  if (!local || typeof local !== "string" || local.trim() === "") return "";
  // Si ya trae timezone (ej. string antiguo sin migrar), lo respetamos tal cual.
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(local)) return local;
  // datetime-local produce "YYYY-MM-DDTHH:mm" (16 chars) o con segundos.
  const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(local);
  return `${local}${hasSeconds ? "" : ":00"}${LIMA_OFFSET_STRING}`;
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
