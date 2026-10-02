// Plantillas de texto del chatbot (T-902). Viven en public.chatbot_templates y
// el bot las lee de ahí; desde el ERP solo se edita el texto.

export interface ChatbotTemplateApi {
  id: number;
  name: string;
  content: string;
  status: string | null;
  description: string | null;
  placeholders: string[];
  required_placeholders: string[];
  updated_at: string;
  updated_by_name: string | null;
}

export interface ChatbotTemplatesListResponse {
  success: boolean;
  error?: string;
  data: ChatbotTemplateApi[];
}

export interface ChatbotTemplateUpdateResponse {
  success: boolean;
  error?: string;
  changed?: boolean;
  updated_at?: string;
}

export interface ChatbotTemplate {
  id: number;
  name: string;
  content: string;
  description: string | null;
  /** Datos que el bot sabe rellenar en esta plantilla. */
  placeholders: string[];
  /** Datos que el texto no puede perder. */
  requiredPlaceholders: string[];
  updatedAt: string;
  updatedByName: string | null;
  /** true si alguien la editó desde el ERP (la semilla no tiene autor). */
  edited: boolean;
}
