// Tipos del CRM de conversaciones.
//
// Dos formas por entidad, como el resto de los módulos: la cruda que devuelve
// el SP (snake_case, tal cual viaja) y la de dominio que consume la UI
// (camelCase, con lo derivado ya resuelto). El adapter traduce entre las dos.

/** Quién escribió el mensaje. `business` es un asesor desde el ERP. */
export type MessageAuthor = "human" | "bot" | "business";

/** Tipos de archivo de WhatsApp (chat_conversations.media_type). `voice` es la nota de voz. */
export type MessageMediaType = "image" | "document" | "audio" | "voice" | "video" | "sticker";

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

/** Lo que el bot ya le pidió al cliente para un pedido (chat_last_conversation_info). */
export interface ConversationCustomerApi {
  name: string | null;
  last_name: string | null;
  document_type_id: number | null;
  document_number: string | null;
  account_id: number | null;
  email: string | null;
  order_id: number | null;
}

export interface ConversationApiRow {
  identity: string;
  /** Red del chat (columna generada del prefijo fb:/ig: de la identidad). */
  network: ConversationChannel;
  phone_number: number | null;
  whatsapp_user_id: string | null;
  whatsapp_username: string | null;
  last_message: string | null;
  last_message_at: string;
  last_message_from: MessageAuthor;
  last_message_media_type: MessageMediaType | null;
  last_message_file_name: string | null;
  last_inbound_at: string | null;
  window_expires_at: string | null;
  window_open: boolean;
  situation: SituationApi | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  taken_by: string | null;
  taken_by_name: string | null;
  customer: ConversationCustomerApi | null;
  bot_answers: boolean;
}

export interface ConversationCountsApi {
  all: number;
  mine: number;
  unassigned: number;
  taken: number;
  window_closed: number;
}

export interface ConversationsApiResponse {
  success: boolean;
  error?: string;
  /** Canal del bot del negocio; null si todavía no tiene WhatsApp. */
  channel_id: number | null;
  data: ConversationApiRow[];
  counts: ConversationCountsApi;
  /** Totales de las pestañas de red (respetan búsqueda y etapa, no la vista). */
  network_counts: Record<ConversationChannel | "all", number>;
  page: { page: number; size: number; total: number };
}

export interface MessageApiRow {
  id: number;
  user: MessageAuthor;
  message: string | null;
  status: string | null;
  created_at: string;
  media: {
    type: MessageMediaType;
    url: string;
    mime_type: string | null;
    file_name: string | null;
    size_bytes: number | null;
  } | null;
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

export interface ConversationCustomer {
  firstName: string | null;
  lastName: string | null;
  documentTypeId: number | null;
  documentNumber: string | null;
  accountId: number | null;
  email: string | null;
  /** Último pedido que el bot dejó armado para este cliente. */
  orderId: number | null;
}

/** Red por la que llega la conversación. */
export type ConversationChannel = "whatsapp" | "instagram" | "facebook" | "tiktok";

export interface Conversation {
  /** Clave de la conversación: el BSUID si lo hay, si no el teléfono. */
  identity: string;
  channel: ConversationChannel;
  phoneNumber: number | null;
  whatsappUserId: string | null;
  /** Título: nombre, si no celular, si no username, si no la identidad cruda. */
  displayName: string;
  /** Los identificadores que el título NO muestra ya. Puede quedar vacío. */
  subtitle: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFrom: MessageAuthor;
  /** Si el último mensaje fue un archivo: la lista lo nombra en vez del marcador. */
  lastMessageMediaType: MessageMediaType | null;
  lastMessageFileName: string | null;
  /** Ventana de 24 h de Meta: fuera de ella solo se pueden enviar plantillas. */
  windowOpen: boolean;
  windowExpiresAt: string | null;
  situation: Situation | null;
  assignedTo: string | null;
  assignedToName: string | null;
  takenBy: string | null;
  takenByName: string | null;
  documentNumber: string | null;
  customer: ConversationCustomer | null;
  /** false = alguien tiene la conversación, o su red tiene el bot apagado. */
  botAnswers: boolean;
}

/** Archivo de un mensaje, entrante o saliente. Vive en el bucket público `crm`. */
export interface MessageMedia {
  type: MessageMediaType;
  url: string;
  mimeType: string | null;
  fileName: string | null;
  sizeBytes: number | null;
}

/** Adjunto ya subido al bucket, listo para mandarse por crm-send-message. */
export interface OutgoingMedia {
  type: Exclude<MessageMediaType, "voice">;
  url: string;
  storagePath: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
}

export interface ConversationMessage {
  id: number;
  author: MessageAuthor;
  message: string;
  media: MessageMedia | null;
  createdAt: string;
  /** Solo para lo que salió por el CRM; el bot no deja acuse. */
  deliveryStatus: string | null;
  deliveryErrorCode: number | null;
}

/** Las vistas de la bandeja (chips sobre la lista). Son excluyentes. */
export type ConversationView = "all" | "mine" | "unassigned" | "taken" | "window_closed";

export type ConversationCounts = Record<ConversationView, number>;

export type NetworkCounts = Record<ConversationChannel | "all", number>;

export interface ConversationFilters {
  search: string;
  situationId: number | null;
  view: ConversationView;
  /** Pestaña de red. Se filtra en el navegador: no vuelve a pedir la lista. */
  channel: ConversationChannel | "all";
}

/**
 * Pausa del bot en UNA conversación. Vive en el servicio del chatbot (no en
 * este ERP) y se lee/escribe por la edge function crm-bot-pause.
 * "Sin pausa" y "sin límite" nunca se confunden: `indefinite` lo dice.
 */
export interface BotPauseState {
  paused: boolean;
  /** ISO; null si no hay pausa o si es sin límite. */
  until: string | null;
  indefinite: boolean;
  /** crm_manual (desde acá) u owner_reply (el dueño respondió desde la app). */
  reason: string | null;
  pausedBy: string | null;
}

export interface BotPauseApi {
  paused: boolean;
  until: string | null;
  indefinite: boolean;
  reason: string | null;
  paused_by: string | null;
}

// ---------------------------------------------------------------------------
// Rendimiento por canal
// ---------------------------------------------------------------------------

/**
 * Las DOS cifras del canal, deliberadamente separadas: `sold` es lo facturado
 * (orders.total) y `collected` lo efectivamente cobrado (order_payment). En
 * los canales de chat la brecha entre las dos es el dato más importante.
 * Nunca se dividen entre sí ni se suman.
 */
export interface ChannelMetricsApi {
  code: ConversationChannel;
  name: string;
  orden: number;
  sale_type_ids: number[] | null;
  orders: number;
  orders_paid: number;
  customers: number;
  units: number;
  sold: number;
  collected: number;
  gap: number;
  /** Qué porcentaje de lo vendido está cobrado. null si no vendió nada. */
  coverage_pct: number | null;
  avg_ticket: number | null;
  median_ticket: number | null;
  share_pct: number | null;
  previous: { orders: number; sold: number; collected: number };
  /** null cuando el período anterior fue cero: no hay variación contra cero. */
  delta_sold_pct: number | null;
  delta_orders_pct: number | null;
}

export interface ChannelMetricsResponse {
  success: boolean;
  error?: string;
  range: {
    start: string;
    end: string;
    days: number;
    previous_start: string;
    previous_end: string;
  };
  company: { sold: number; collected: number };
  channels: ChannelMetricsApi[];
}

export interface ChannelPointApi {
  period: string;
  code: ConversationChannel;
  name: string;
  orders: number;
  sold: number;
  collected: number;
}

export interface ChannelOverTimeResponse {
  success: boolean;
  error?: string;
  granularity: "day" | "week" | "month";
  points: ChannelPointApi[];
}

export interface ChannelProductApi {
  code: ConversationChannel;
  product_id: number | null;
  name: string | null;
  units: number;
  sold: number;
}

export interface ChannelProductsResponse {
  success: boolean;
  error?: string;
  products: ChannelProductApi[];
}

// ---------------------------------------------------------------------------
// Costos por canal
// ---------------------------------------------------------------------------

export interface ChannelCostApi {
  code: ConversationChannel;
  name: string;
  class_code: string;
  orders: number;
  sold: number;
  collected: number;
  direct_cost: number;
  /** Cuántos movimientos hay cargados. En 0, la contribución no significa nada. */
  cost_entries: number;
  contribution: number;
  cost_per_order: number | null;
  cost_ratio_pct: number | null;
}

export interface SharedCostApi {
  class_code: string;
  name: string;
  amount: number;
  entries: number;
}

export interface ChannelCostsResponse {
  success: boolean;
  error?: string;
  range: { start: string; end: string };
  /**
   * Por qué la pantalla no muestra margen: exigiría el costo de la mercadería,
   * y solo se habla de margen cuando está cargado en el 80 % de las variantes.
   */
  product_cost: {
    variations: number;
    with_cost: number;
    coverage_pct: number | null;
    margin_available: boolean;
  };
  channels: ChannelCostApi[];
  /** Infra, IA y asesores: sostienen los tres canales y NO se prorratean. */
  shared: SharedCostApi[];
  shared_total: number;
  direct_total: number;
}

// ---------------------------------------------------------------------------
// Tablero por etapa
// ---------------------------------------------------------------------------

export interface BoardCardApi {
  identity: string;
  phone_number: number | null;
  whatsapp_user_id: string | null;
  whatsapp_username: string | null;
  last_message: string | null;
  last_message_at: string;
  last_message_from: MessageAuthor;
  assigned_to: string | null;
  assigned_to_name: string | null;
  taken_by: string | null;
  customer: {
    name: string | null;
    last_name: string | null;
    document_number: string | null;
  } | null;
}

export interface BoardColumnApi {
  situation_id: number | null;
  name: string;
  code: string | null;
  status_code: string | null;
  order: number | null;
  total: number;
  cards: BoardCardApi[];
}

export interface BoardApiResponse {
  success: boolean;
  error?: string;
  columns: BoardColumnApi[];
}

export interface BoardCard {
  identity: string;
  phoneNumber: number | null;
  whatsappUserId: string | null;
  displayName: string;
  subtitle: string;
  lastMessage: string;
  lastMessageAt: string;
  assignedToName: string | null;
  /** Alguien la está atendiendo ahora: el bot está callado en ese chat. */
  taken: boolean;
}

export interface BoardColumn {
  /** null es la columna "Sin etapa": los chats que nadie clasificó todavía. */
  situationId: number | null;
  name: string;
  statusCode: string | null;
  /** Total real en esa etapa, que puede ser mayor que las tarjetas traídas. */
  total: number;
  cards: BoardCard[];
}
