import type { ChatbotTemplate, ChatbotTemplateApi } from "../types/chatbotTemplates.types";
import { KNOWN_LABELS, variableExample, variableLabel } from "./chatbotTemplateVariables";

export const toChatbotTemplate = (t: ChatbotTemplateApi): ChatbotTemplate => ({
  id: t.id,
  name: t.name,
  content: t.content,
  description: t.description,
  topic: t.topic ?? null,
  status: t.status,
  fromErp: t.origin === "erp",
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

/**
 * Texto del editor → texto de la base. Un [Nombre] que no es un dato de esta
 * plantilla se deja tal cual (lo frena la validación si es un dato de otra).
 */
export const fromFriendlyText = (
  text: string,
  vars: TemplateVariable[],
  fallbacks: Record<string, string>
): string =>
  text.replace(LABEL_RE, (whole, label: string) => {
    const v = findVariable(vars, label);
    if (!v) return whole;
    if (v.fallback != null) return `{${v.key}|${(fallbacks[v.key] ?? v.fallback).replace(/[{}]/g, "").trim()}}`;
    return `{${v.key}${v.optional ? "?" : ""}}`;
  });

/** Mismas reglas que sp_crm_chatbot_template_update, dichas con los nombres del editor. */
export const validateFriendlyText = (
  text: string,
  vars: TemplateVariable[],
  fallbacks: Record<string, string>
): string | null => {
  if (!text.trim()) return "El texto no puede quedar vacío.";
  if (/\{[A-Za-z0-9_]+(\?|\|[^}]*)?\}/.test(text)) {
    return "Para agregar un dato usa los botones de «Insertar dato», no las llaves { }.";
  }
  const used = Array.from(text.matchAll(LABEL_RE), (m) => m[1]);
  const ajeno = used.find((l) => !findVariable(vars, l) && KNOWN_LABELS.has(l.trim().toLowerCase()));
  if (ajeno) return `El dato [${ajeno.trim()}] no está disponible en esta plantilla.`;
  const falta = vars.filter((v) => v.required && !used.some((l) => findVariable([v], l)));
  if (falta.length) {
    return `Falta ${falta.map((v) => `[${v.label}]`).join(", ")}. El bot necesita ese dato para armar este mensaje.`;
  }
  const sinTexto = vars.find((v) => v.fallback != null && !(fallbacks[v.key] ?? v.fallback).replace(/[{}]/g, "").trim());
  if (sinTexto) return `Escribe qué decir cuando el bot no tiene [${sinTexto.label}].`;
  return null;
};

/** Vista previa: cada dato reemplazado por un ejemplo real. */
export const previewFriendlyText = (text: string, vars: TemplateVariable[]): string =>
  text.replace(LABEL_RE, (whole, label: string) => {
    const v = findVariable(vars, label);
    return v ? variableExample(v.key) : whole;
  });
