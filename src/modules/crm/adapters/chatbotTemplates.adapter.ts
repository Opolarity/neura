import type { ChatbotTemplate, ChatbotTemplateApi } from "../types/chatbotTemplates.types";

export const toChatbotTemplate = (t: ChatbotTemplateApi): ChatbotTemplate => ({
  id: t.id,
  name: t.name,
  content: t.content,
  description: t.description,
  placeholders: t.placeholders ?? [],
  requiredPlaceholders: t.required_placeholders ?? [],
  updatedAt: t.updated_at,
  updatedByName: t.updated_by_name,
  edited: t.updated_by_name != null,
});

/** Mismo patrón que fillTemplate del bot: {clave}, {clave?} y {clave|texto}. */
const PLACEHOLDER_RE = /\{([A-Za-z0-9_]+)(\?|\|[^}]*)?\}/g;

export const placeholderKeys = (text: string): string[] =>
  Array.from(new Set(Array.from(text.matchAll(PLACEHOLDER_RE), (m) => m[1])));

/**
 * Lo mismo que valida sp_crm_chatbot_template_update, para avisar antes de
 * guardar. El SP sigue siendo quien decide.
 */
export const validateTemplateContent = (
  template: ChatbotTemplate,
  content: string
): string | null => {
  if (!content.trim()) return "El texto no puede quedar vacío.";
  const keys = placeholderKeys(content);
  const missing = template.requiredPlaceholders.filter((k) => !keys.includes(k));
  if (missing.length) {
    return `Falta el dato obligatorio ${missing.map((k) => `{${k}}`).join(", ")}. El bot lo necesita para armar este mensaje.`;
  }
  const unknown = keys.filter((k) => !template.placeholders.includes(k));
  if (unknown.length) {
    return `El bot no conoce el dato ${unknown.map((k) => `{${k}}`).join(", ")} en esta plantilla. Usa solo los datos disponibles.`;
  }
  return null;
};

/** Vista previa: cada dato se muestra como [dato]; los que tienen texto por defecto, con ese texto. */
export const previewTemplate = (content: string): string =>
  content.replace(PLACEHOLDER_RE, (_m, key: string, mod?: string) =>
    mod && mod.startsWith("|") ? mod.slice(1) : `[${key}]`
  );
