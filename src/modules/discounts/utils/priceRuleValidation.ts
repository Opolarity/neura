import type {
  ActionConfig,
  Condition,
  PriceRuleFormData,
  TargetFilter,
} from "../types/priceRule.types";
import {
  ACTION_TYPE_LABELS,
  CONDITION_TYPE_LABELS,
} from "../types/priceRule.types";

// Una condición o acción que apunta a "productos específicos" pero sin ningún
// producto elegido no significa nada: según cómo la lea el motor, se aplicaría
// a todo o a nada. Se bloquea el guardado en vez de dejar pasar la ambigüedad.

const idsOf = (source: Record<string, unknown>, key: string): number[] =>
  (source[key] as number[] | undefined) ?? [];

const targetError = (target: TargetFilter | undefined): string | null => {
  switch (target?.apply_to) {
    case "specific_products":
      return target.product_ids?.length ? null : "elige al menos un producto";
    case "specific_variations":
      return target.variation_ids?.length ? null : "elige al menos una variación";
    case "specific_categories":
      return target.category_ids?.length ? null : "elige al menos una categoría";
    case "specific_brands":
      return target.brand_ids?.length ? null : "elige al menos una marca";
    case "specific_tags":
      return target.tag_ids?.length ? null : "elige al menos una etiqueta";
    default:
      return null;
  }
};

const actionError = (action: ActionConfig): string | null => {
  if (action.type === "free_gift") {
    return action.variation_id ? null : "elige la variación de regalo";
  }
  return targetError(action.target);
};

const conditionError = (condition: Condition): string | null => {
  switch (condition.type) {
    case "product_in_cart":
      return idsOf(condition, "product_ids").length
        ? null
        : "elige al menos un producto";
    case "variation_in_cart":
      return idsOf(condition, "variation_ids").length
        ? null
        : "elige al menos una variación";
    case "category_in_cart":
    case "min_category_quantity":
      return idsOf(condition, "category_ids").length
        ? null
        : "elige al menos una categoría";
    case "brand_in_cart":
      return idsOf(condition, "brand_ids").length
        ? null
        : "elige al menos una marca";
    case "tag_in_cart":
      return idsOf(condition, "tag_ids").length
        ? null
        : "elige al menos una etiqueta";
    default:
      return null;
  }
};

/** Primer problema que impide guardar la regla, o `null` si está completa. */
export function getPriceRuleFormError(
  formData: PriceRuleFormData,
): string | null {
  if (!formData.name.trim()) return "El nombre es requerido";

  if (formData.rule_type === "coupon" && !formData.coupon_code.trim()) {
    return "El código de cupón es requerido";
  }

  if (formData.actions.length === 0) {
    return "Debe agregar al menos una acción";
  }

  const groups = formData.conditions?.groups ?? [];
  const hasMultipleGroups = groups.length > 1;

  for (let g = 0; g < groups.length; g++) {
    const conditions = groups[g].conditions ?? [];
    for (let c = 0; c < conditions.length; c++) {
      const error = conditionError(conditions[c]);
      if (!error) continue;
      const where = hasMultipleGroups
        ? `Condición ${c + 1} del grupo ${g + 1}`
        : `Condición ${c + 1}`;
      const label = CONDITION_TYPE_LABELS[conditions[c].type] ?? conditions[c].type;
      return `${where} (${label}): ${error}`;
    }
  }

  for (let i = 0; i < formData.actions.length; i++) {
    const error = actionError(formData.actions[i]);
    if (!error) continue;
    const label =
      ACTION_TYPE_LABELS[formData.actions[i].type] ?? formData.actions[i].type;
    return `Acción ${i + 1} (${label}): ${error}`;
  }

  return null;
}
