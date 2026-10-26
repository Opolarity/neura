import type { ChatbotPromptSetting, ChatbotPromptSettingApi } from "../types/chatbotBehavior.types";

export const toChatbotPromptSetting = (row: ChatbotPromptSettingApi): ChatbotPromptSetting => ({
  code: row.setting_code,
  type: row.setting_type,
  name: row.display_name,
  description: row.description ?? "",
  published: row.published_value ?? "",
  draft: row.draft_value,
  allowedValues: row.allowed_values ?? [],
  optionLabels: row.option_labels ?? {},
  multiple: row.allows_multiple_values,
  maxCharacters: row.max_characters,
  draftUpdatedAt: row.draft_updated_at,
  draftUpdatedByName: row.draft_updated_by_name,
  publishedAt: row.published_at,
  publishedByName: row.published_by_name,
});

/** Lo que muestra el formulario al abrir: el borrador si hay, si no lo publicado. */
export const currentValue = (s: ChatbotPromptSetting): string => s.draft ?? s.published;

/** Una opción con varios valores se guarda separada por comas y en el orden de `allowedValues`. */
export const toMultiValue = (s: ChatbotPromptSetting, selected: string[]): string =>
  s.allowedValues.filter((v) => selected.includes(v)).join(",");

export const fromMultiValue = (value: string): string[] =>
  value.split(",").map((v) => v.trim()).filter(Boolean);

/** Cómo se ve un valor guardado en el historial (las opciones con su texto). */
export const describeValue = (s: ChatbotPromptSetting, value: string): string => {
  if (s.type !== "flow_option") return value || "(vacío)";
  const parts = fromMultiValue(value).map((v) => s.optionLabels[v] ?? v);
  return parts.length ? parts.join(", ") : "Nada más";
};
