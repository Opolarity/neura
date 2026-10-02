// Plantillas de texto del chatbot (T-902). Viven en public.chatbot_templates y
// el bot las lee de ahí. T-917: cada una lleva una etiqueta principal (uno de
// los 11 temas de Jev) y etiquetas extra; un admin puede crear plantillas
// nuevas. Las especiales (locked) no cambian sus etiquetas.

/** Los 11 temas con que Jev clasifica cada turno del bot (neura-chatbot, src/core/jev.ts). */
export type ChatbotTemplateTopic =
  | "vender"
  | "recibir_pago"
  | "consultar_pedidos"
  | "puntos_y_datos"
  | "falla_web"
  | "conversacion"
  | "reclamo"
  | "pedir_asesor"
  | "propuesta_comercial"
  | "info_tienda"
  | "otro";


export interface ChatbotTemplateApi {
  id: number;
  name: string;
  content: string;
  status: string | null;
  description: string | null;
  topic: ChatbotTemplateTopic | null;
  origin: "system" | "erp";
  locked: boolean;
  /** Etiquetas extra (nombres); la principal es `topic`. */
  tags: string[];
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

export interface ChatbotTagApi {
  id: number;
  code: string;
  name: string;
  /** Uno de los 11 temas de Jev: puede ser la etiqueta principal. */
  is_jev: boolean;
  templates_count: number;
}

export interface ChatbotTagsListResponse {
  success: boolean;
  error?: string;
  data: ChatbotTagApi[];
}

export interface ChatbotTemplateCreateResponse {
  success: boolean;
  error?: string;
  id?: number;
  name?: string;
}

export interface ChatbotTemplate {
  id: number;
  name: string;
  content: string;
  description: string | null;
  /** Etiqueta principal: uno de los 11 temas de Jev. */
  topic: ChatbotTemplateTopic | null;
  /** Etiquetas extra (nombres). */
  tags: string[];
  /** true si la creó un admin desde el ERP. */
  fromErp: boolean;
  /** Especial: la arma el bot en un flujo fijo; sus etiquetas no se editan. */
  locked: boolean;
  /** Datos que el bot sabe rellenar en esta plantilla. */
  placeholders: string[];
  /** Datos que el texto no puede perder. */
  requiredPlaceholders: string[];
  updatedAt: string;
  updatedByName: string | null;
  /** true si alguien la editó desde el ERP (la semilla no tiene autor). */
  edited: boolean;
}

/** Las etiquetas de una plantilla: la principal y las extra (nombres). */
export interface ChatbotTemplateMeta {
  topic: ChatbotTemplateTopic;
  tags: string[];
}

export interface ChatbotTemplateCreateInput extends ChatbotTemplateMeta {
  name: string;
  content: string;
}
