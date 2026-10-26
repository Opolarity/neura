import type { ChatbotPromptSetting, ChatbotPromptSettingApi, ChatbotStoreLocation } from "../types/chatbotBehavior.types";

/** Las sedes de un valor de `store_locations`; [] si no se puede leer. */
export const toStoreLocations = (value: string): ChatbotStoreLocation[] => {
  try {
    const list = JSON.parse(value || "[]") as unknown;
    if (!Array.isArray(list)) return [];
    return list.map((o: Record<string, unknown>) => ({
      ciudad: String(o?.ciudad ?? ""),
      nombre: String(o?.nombre ?? ""),
      direccion: String(o?.direccion ?? ""),
      horario: String(o?.horario ?? ""),
      whatsapp: String(o?.whatsapp ?? ""),
      propia: o?.propia === true,
    }));
  } catch {
    return [];
  }
};

/** Siempre con las mismas claves y en el mismo orden, para comparar con lo guardado. */
export const fromStoreLocations = (stores: ChatbotStoreLocation[]): string =>
  JSON.stringify(stores.map(({ ciudad, nombre, direccion, horario, whatsapp, propia }) => ({ ciudad, nombre, direccion, horario, whatsapp, propia })));

/**
 * ¿Dos valores del ajuste son el mismo? Las sedes se comparan por contenido:
 * el ERP guarda el JSON con otro orden de claves que el formulario.
 */
export const sameValue = (s: ChatbotPromptSetting, a: string, b: string): boolean =>
  s.type === "store_list" ? fromStoreLocations(toStoreLocations(a)) === fromStoreLocations(toStoreLocations(b)) : a === b;

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
  if (s.type === "store_list") {
    const stores = toStoreLocations(value);
    return `${stores.length} ${stores.length === 1 ? "sede" : "sedes"}: ${stores.map((x) => `${x.nombre} (${x.ciudad})`).join(", ")}`;
  }
  if (s.type !== "flow_option") return value || "(vacío)";
  const parts = fromMultiValue(value).map((v) => s.optionLabels[v] ?? v);
  return parts.length ? parts.join(", ") : "Nada más";
};
