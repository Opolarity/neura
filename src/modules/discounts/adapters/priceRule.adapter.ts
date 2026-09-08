import type {
  ActionConfig,
  PriceRule,
  PriceRuleFormData,
  PriceRulePagination,
  ConditionsConfig,
} from "../types/priceRule.types";
import {
  CONSIGNMENT_CONDITION_TYPE,
  FRANCHISEE_EXCLUSION_CONDITION_TYPE,
  DEFAULT_INCLUDE_DESCENDANTS,
} from "../types/priceRule.types";
import { limaDateTimeLocalToIso, limaIsoToDateTimeLocal } from "@/shared/utils/date";

// --- Marcadores de franquiciados dentro de `conditions` -------------------
// Dos marcadores comparten la misma forma: viven en un grupo propio y llevan
// opcionalmente `tenant_references`. `consignment_channel` marca la promo de
// consignación; `franchisee_exclusion` marca a quién NO se le aplica la regla.
// Ambos soportan el formato vigente ({ groups }) y el legacy (array plano).

function hasMarkerOfType(
  conditions: ConditionsConfig | unknown[] | null | undefined,
  markerType: string,
): boolean {
  if (!conditions) return false;

  const hasMarker = (list: unknown): boolean =>
    Array.isArray(list) &&
    list.some(
      (c) =>
        !!c &&
        typeof c === "object" &&
        (c as { type?: unknown }).type === markerType,
    );

  if (Array.isArray(conditions)) return hasMarker(conditions);
  return (conditions.groups ?? []).some((g) => hasMarker(g?.conditions));
}

function getMarkerTenantReferences(
  conditions: ConditionsConfig | unknown[] | null | undefined,
  markerType: string,
): string[] {
  if (!conditions) return [];

  const fromList = (list: unknown): string[] => {
    if (!Array.isArray(list)) return [];
    for (const c of list) {
      if (
        !!c &&
        typeof c === "object" &&
        (c as { type?: unknown }).type === markerType
      ) {
        const refs = (c as { tenant_references?: unknown }).tenant_references;
        if (!Array.isArray(refs)) return [];
        return [
          ...new Set(
            refs
              .map((r) => (typeof r === "string" ? r.trim() : ""))
              .filter((r) => r.length > 0),
          ),
        ];
      }
    }
    return [];
  };

  if (Array.isArray(conditions)) return fromList(conditions);
  for (const g of conditions.groups ?? []) {
    const refs = fromList(g?.conditions);
    if (refs.length > 0) return refs;
  }
  return [];
}

function isMarkerGroupOfType(
  group: { conditions?: Array<{ type?: string }> },
  markerType: string,
): boolean {
  return (
    (group.conditions?.length ?? 0) > 0 &&
    (group.conditions ?? []).every((c) => c?.type === markerType)
  );
}

// ¿La regla está marcada como promoción de consignación (franquiciados)?
export function hasConsignmentMarker(
  conditions: ConditionsConfig | unknown[] | null | undefined,
): boolean {
  return hasMarkerOfType(conditions, CONSIGNMENT_CONDITION_TYPE);
}

// tenant_reference de los franquiciados seleccionados en el marcador de
// consignación. Vacío = la promo aplica a todos los franquiciados.
export function getConsignmentTenantReferences(
  conditions: ConditionsConfig | unknown[] | null | undefined,
): string[] {
  return getMarkerTenantReferences(conditions, CONSIGNMENT_CONDITION_TYPE);
}

// ¿Este grupo es el grupo marcador (solo contiene la condición de consignación)?
export function isConsignmentMarkerGroup(group: {
  conditions?: Array<{ type?: string }>;
}): boolean {
  return isMarkerGroupOfType(group, CONSIGNMENT_CONDITION_TYPE);
}

// ¿La regla excluye franquiciados?
export function hasFranchiseeExclusionMarker(
  conditions: ConditionsConfig | unknown[] | null | undefined,
): boolean {
  return hasMarkerOfType(conditions, FRANCHISEE_EXCLUSION_CONDITION_TYPE);
}

// tenant_reference de los franquiciados excluidos. Vacío = se excluyen todos.
export function getFranchiseeExclusionTenantReferences(
  conditions: ConditionsConfig | unknown[] | null | undefined,
): string[] {
  return getMarkerTenantReferences(
    conditions,
    FRANCHISEE_EXCLUSION_CONDITION_TYPE,
  );
}

// ¿Este grupo es el grupo marcador de exclusión de franquiciados?
export function isFranchiseeExclusionMarkerGroup(group: {
  conditions?: Array<{ type?: string }>;
}): boolean {
  return isMarkerGroupOfType(group, FRANCHISEE_EXCLUSION_CONDITION_TYPE);
}

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
  exclusions: null,
  coupon_code: "",
  max_uses: null,
  max_uses_per_customer: null,
};
// ISO (con o sin timezone) → "YYYY-MM-DDTHH:mm" en hora Lima, listo para <input type="datetime-local">.
export function isoToDateTimeLocal(iso: string | null | undefined): string {
  return limaIsoToDateTimeLocal(iso);
}

// "YYYY-MM-DDTHH:mm" (asumido en hora Lima) → ISO 8601 con offset -05:00, o "" si vacío.
// El backend interpreta "" como NULL, así que conservamos string para mantener la forma del tipo PriceRuleFormData.
export function dateTimeLocalToISO(local: string | null | undefined): string {
  return limaDateTimeLocalToIso(local);
}

// El switch "Incluir subcategorías" se pinta encendido cuando la clave no
// existe (reglas guardadas antes de que el campo existiera), así que al cargar
// se rellena explícita: si no, lo que se ve marcado y lo que se guarda no
// coinciden. Se normaliza al entrar y no al salir para que el estado del
// formulario y el payload sean siempre lo mismo.
const withDescendantsDefault = <
  T extends { category_ids?: number[]; include_descendants?: boolean },
>(
  source: T,
): T =>
  source.category_ids?.length
    ? {
        ...source,
        include_descendants:
          source.include_descendants ?? DEFAULT_INCLUDE_DESCENDANTS,
      }
    : source;

function normalizeConditions(conditions: ConditionsConfig): ConditionsConfig {
  return {
    ...conditions,
    groups: (conditions.groups ?? []).map((group) => ({
      ...group,
      conditions: (group.conditions ?? []).map((condition) =>
        condition.type === "category_in_cart" ||
        condition.type === "min_category_quantity"
          ? withDescendantsDefault(condition)
          : condition,
      ),
    })),
  };
}

function normalizeActions(actions: ActionConfig[]): ActionConfig[] {
  return actions.map((action) =>
    action.target?.apply_to === "specific_categories"
      ? { ...action, target: withDescendantsDefault(action.target) }
      : action,
  );
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
    conditions: normalizeConditions(rule.conditions || DEFAULT_CONDITIONS),
    actions: normalizeActions(rule.actions || []),
    exclusions: rule.exclusions || null,
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
