import type { ChatbotTemplate, ChatbotTemplateApi } from "../types/chatbotTemplates.types";
import { variableExample, variableKeyForLabel, variableLabel } from "./chatbotTemplateVariables";

export const toChatbotTemplate = (t: ChatbotTemplateApi): ChatbotTemplate => ({
  id: t.id,
  name: t.name,
  content: t.content,
  description: t.description,
  topic: t.topic ?? null,
  tags: t.tags ?? [],
  fromErp: t.origin === "erp",
  locked: t.locked === true,
  placeholders: t.placeholders ?? [],
  requiredPlaceholders: t.required_placeholders ?? [],
  updatedAt: t.updated_at,
  updatedByName: t.updated_by_name,
  edited: t.updated_by_name != null,
});

/** Mismo patrón que fillTemplate del bot: {clave}, {clave?} y {clave|texto}. */
const PLACEHOLDER_RE = /\{([A-Za-z0-9_]+)(\?|\|[^}]*)?\}/g;
/** Un dato tal como se ve en el editor: [Número de pedido]. */
const LABEL_RE = /\[([^[\]\n]+)\]/g;

/**
 * Un dato que el bot rellena en esta plantilla. `optional` y `fallback`
 * guardan la forma en que el texto original lo usaba ({x?} o {x|texto}), que
 * el editor no muestra pero se conserva al guardar.
 */
export interface TemplateVariable {
  key: string;
  label: string;
  required: boolean;
  optional: boolean;
  /** Texto que va cuando el bot no tiene el dato; null si el dato no lo usa. */
  fallback: string | null;
}

export const templateVariables = (t: ChatbotTemplate): TemplateVariable[] => {
  const mods = new Map<string, string>();
  for (const m of t.content.matchAll(PLACEHOLDER_RE)) {
    if (!mods.has(m[1])) mods.set(m[1], m[2] ?? "");
  }
  return t.placeholders.map((key) => {
    const mod = mods.get(key) ?? "";
    return {
      key,
      label: variableLabel(key),
      required: t.requiredPlaceholders.includes(key),
      optional: mod === "?",
      fallback: mod.startsWith("|") ? mod.slice(1) : null,
    };
  });
};

/** Texto de la base → texto del editor: {numero_pedido} pasa a [Número de pedido]. */
export const toFriendlyText = (content: string): string =>
  content.replace(PLACEHOLDER_RE, (_m, key: string) => `[${variableLabel(key)}]`);

const findVariable = (vars: TemplateVariable[], label: string) => {
  const wanted = label.trim().toLowerCase();
  return vars.find((v) => v.label.toLowerCase() === wanted);
};

/** Los datos de esta plantilla que siguen en el texto del editor. */
export const variablesInText = (text: string, vars: TemplateVariable[]): TemplateVariable[] => {
  const used = Array.from(text.matchAll(LABEL_RE), (m) => m[1]);
  return vars.filter((v) => used.some((l) => findVariable([v], l)));
};

/**
 * Texto del editor → texto de la base. T-917 (05/10/2026): cualquier [Nombre]
 * es un dato.
 * - Uno que esta plantilla ya tenía conserva su forma ({x}, {x?} o {x|texto}):
 *   hay plantillas que a propósito pierden la línea entera si el dato no llega.
 * - Uno nuevo va como {clave?}: el bot lo llena si puede y, si no, no lo muestra.
 */
export const fromFriendlyText = (
  text: string,
  vars: TemplateVariable[],
  fallbacks: Record<string, string>
): string =>
  text.replace(LABEL_RE, (whole, label: string) => {
    const v = findVariable(vars, label);
    if (v) {
      if (v.fallback != null) return `{${v.key}|${(fallbacks[v.key] ?? v.fallback).replace(/[{}]/g, "").trim()}}`;
      return `{${v.key}${v.optional ? "?" : ""}}`;
    }
    const key = variableKeyForLabel(label);
    return key ? `{${key}?}` : whole;
  });

/**
 * Mismas reglas que sp_crm_chatbot_template_update, dichas con los nombres del
 * editor. Desde T-917 (05/10/2026) los datos se agregan y se quitan libremente.
 */
export const validateFriendlyText = (
  text: string,
  vars: TemplateVariable[],
  fallbacks: Record<string, string>
): string | null => {
  if (!text.trim()) return "El texto no puede quedar vacío.";
  if (/\{[A-Za-z0-9_]+(\?|\|[^}]*)?\}/.test(text)) {
    return "Para agregar un dato escríbelo entre corchetes, por ejemplo [Ciudad], no entre llaves { }.";
  }
  const sinTexto = variablesInText(text, vars).find(
    (v) => v.fallback != null && !(fallbacks[v.key] ?? v.fallback).replace(/[{}]/g, "").trim()
  );
  if (sinTexto) return `Escribe qué decir cuando el bot no tiene [${sinTexto.label}].`;
  return null;
};

/** Vista previa: cada dato conocido con un ejemplo; uno nuevo se ve tal como se escribió. */
export const previewFriendlyText = (text: string, vars: TemplateVariable[]): string =>
  text.replace(LABEL_RE, (whole, label: string) => {
    const v = findVariable(vars, label);
    if (v) return variableExample(v.key);
    // Solo los datos conocidos tienen ejemplo; para los demás variableExample devuelve el nombre.
    const key = variableKeyForLabel(label);
    return key && variableExample(key) !== variableLabel(key) ? variableExample(key) : whole;
  });
