// Tipos del CRM de conversaciones.
//
// Dos formas por entidad, como el resto de los módulos: la cruda que devuelve
// el SP (snake_case, tal cual viaja) y la de dominio que consume la UI
// (camelCase, con lo derivado ya resuelto). El adapter traduce entre las dos.

/** Quién escribió el mensaje. `business` es un asesor desde el ERP. */
export type MessageAuthor = "human" | "bot" | "business";

// ---------------------------------------------------------------------------
// Respuesta del SP
// ---------------------------------------------------------------------------

export interface SituationApi {
  id: number;
  name: string;
  code: string;
  status_code: string;
  order: number | null;
}

export interface ConversationApiRow {
  identity: string;
  phone_number: number | null;
  whatsapp_user_id: string | null;
  whatsapp_username: string | null;
  last_message: string | null;
  last_message_at: string;
  last_message_from: MessageAuthor;
  last_inbound_at: string | null;
  window_expires_at: string | null;
  window_open: boolean;
  situation: SituationApi | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  taken_by: string | null;
  taken_by_name: string | null;
  customer: {
    name: string | null;
    last_name: string | null;
    document_number: string | null;
    account_id: number | null;
  } | null;
  bot_answers: boolean;
}

export interface ConversationsApiResponse {
  success: boolean;
  error?: string;
  data: ConversationApiRow[];
  page: { page: number; size: number; total: number };
}

export interface MessageApiRow {
  id: number;
  user: MessageAuthor;
  message: string | null;
  status: string | null;
  created_at: string;
  delivery: {
    status: string | null;
    error_code: number | null;
    sent_by: string | null;
  } | null;
}

export interface ThreadApiResponse {
  success: boolean;
  error?: string;
  messages: MessageApiRow[];
}

/** Todos los SPs de escritura del CRM responden con esta forma. */
export interface CrmWriteResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Dominio
// ---------------------------------------------------------------------------

export interface Situation {
  id: number;
  name: string;
  code: string;
  statusCode: string;
  order: number | null;
}

export interface Conversation {
  /** Clave de la conversación: el BSUID si lo hay, si no el teléfono. */
  identity: string;
  phoneNumber: number | null;
  whatsappUserId: string | null;
  /** Lo que se muestra en la lista: nombre del cliente, username o identidad. */
  displayName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFrom: MessageAuthor;
  /** Ventana de 24 h de Meta: fuera de ella solo se pueden enviar plantillas. */
  windowOpen: boolean;
  windowExpiresAt: string | null;
  situation: Situation | null;
  assignedTo: string | null;
  assignedToName: string | null;
  takenBy: string | null;
  takenByName: string | null;
  documentNumber: string | null;
  /** false = alguien tiene la conversación, o el canal tiene el bot apagado. */
  botAnswers: boolean;
}

export interface ConversationMessage {
  id: number;
  author: MessageAuthor;
  message: string;
  createdAt: string;
  /** Solo para lo que salió por el CRM; el bot no deja acuse. */
  deliveryStatus: string | null;
  deliveryErrorCode: number | null;
}

export interface ConversationFilters {
  search: string;
  situationId: number | null;
  assignedTo: string | null;
  unassigned: boolean;
  taken: boolean | null;
}
