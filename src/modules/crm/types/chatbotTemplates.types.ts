// Plantillas de texto del chatbot (T-902). Viven en public.chatbot_templates y
// el bot las lee de ahí. T-917: cada una lleva un tema de Jev y un admin puede
// crear plantillas nuevas; en las del sistema solo se edita el texto.

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

/** Estado con el que el bot cierra el turno al usar la plantilla. */
export type ChatbotTemplateStatus = "consulting_information" | "other";

export interface ChatbotTemplateApi {
  id: number;
  name: string;
  content: string;
  status: string | null;
  description: string | null;
  topic: ChatbotTemplateTopic | null;
  origin: "system" | "erp";
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
  topic: ChatbotTemplateTopic | null;
  status: string | null;
  /** true si la creó un admin desde el ERP: se edita todo menos el nombre. */
  fromErp: boolean;
  /** Datos que el bot sabe rellenar en esta plantilla. */
  placeholders: string[];
  /** Datos que el texto no puede perder. */
  requiredPlaceholders: string[];
  updatedAt: string;
  updatedByName: string | null;
  /** true si alguien la editó desde el ERP (la semilla no tiene autor). */
  edited: boolean;
}

/** Lo que se carga al crear una plantilla, o al editar una creada desde el ERP. */
export interface ChatbotTemplateMeta {
  topic: ChatbotTemplateTopic;
  description: string;
  status: ChatbotTemplateStatus;
}

export interface ChatbotTemplateCreateInput extends ChatbotTemplateMeta {
  name: string;
  content: string;
}
