/**
 * Ajustes del prompt del chatbot que edita el cliente (CRM > Chatbot >
 * Comportamiento). Tabla `chatbot_prompt_settings` del backend: cada ajuste
 * tiene lo publicado (lo que usa el bot) y un borrador.
 */
export type ChatbotPromptSettingType = "vocabulary" | "flow_option" | "business_instructions";

/** Fila tal como la devuelve `sp_crm_chatbot_prompt_settings_list`. */
export interface ChatbotPromptSettingApi {
  setting_code: string;
  setting_type: ChatbotPromptSettingType;
  display_name: string;
  description: string | null;
  published_value: string;
  draft_value: string | null;
  allowed_values: string[] | null;
  option_labels: Record<string, string> | null;
  allows_multiple_values: boolean;
  max_characters: number | null;
  draft_updated_at: string;
  draft_updated_by_name: string | null;
  published_at: string | null;
  published_by_name: string | null;
}

export interface ChatbotPromptSetting {
  code: string;
  type: ChatbotPromptSettingType;
  name: string;
  description: string;
  /** Lo que usa el bot hoy. */
  published: string;
  /** Borrador sin publicar; null = nada pendiente. */
  draft: string | null;
  allowedValues: string[];
  optionLabels: Record<string, string>;
  multiple: boolean;
  maxCharacters: number | null;
  /** Bloqueo optimista: se manda al guardar el borrador. */
  draftUpdatedAt: string;
  draftUpdatedByName: string | null;
  publishedAt: string | null;
  publishedByName: string | null;
}

export interface ChatbotPromptSettingHistoryItem {
  value: string;
  previous_value: string | null;
  published_at: string;
  published_by_name: string | null;
}

export interface ChatbotPromptSettingsListResponse {
  success: boolean;
  error?: string;
  data: ChatbotPromptSettingApi[];
}

export interface ChatbotPromptSettingSaveResponse {
  success: boolean;
  error?: string;
  changed?: boolean;
  draft_updated_at?: string;
}

export interface ChatbotPromptSettingsPublishResponse {
  success: boolean;
  error?: string;
  published?: number;
}

export interface ChatbotPromptSettingsDiscardResponse {
  success: boolean;
  error?: string;
  discarded?: number;
}

export interface ChatbotPromptSettingHistoryResponse {
  success: boolean;
  error?: string;
  data: ChatbotPromptSettingHistoryItem[];
}
