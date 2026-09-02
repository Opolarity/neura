import type { FunctionErrorCode as EdgeFunctionErrorCode } from "@/shared/utils/functionError";

export type SupportRequestType = "ticket" | "suggestion";

export interface SupportAttachment {
  fileName: string;
  mimeType: string;
  contentBase64: string;
}

export interface SupportRequestPayload {
  title: string;
  description?: string;
  requestType: SupportRequestType;
  reporterName: string;
  /** Página del ERP desde donde se envía: alimenta el filtro por origen. */
  originUrl?: string;
  attachments?: SupportAttachment[];
}

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

/* ------------------------------------------------------------------ *
 * Listado de solicitudes (edge function get-support-requests)
 * ------------------------------------------------------------------ */

/** Item tal como lo devuelve la edge function (snake_case, crudo). */
export interface SupportRequestApiItem {
  id: string;
  /**
   * Código público de la solicitud (el `S-n`). Número: el prefijo "S-" es
   * presentación y lo pone la UI. Opcional porque las versiones anteriores de
   * la API externa no lo devolvían.
   */
  code?: number | null;
  title: string | null;
  /** "recibido" | "rechazado" | nombre del estado de la tarea (configurable). */
  status: string | null;
  /** Código de la tarea vinculada (el `T-n`), o null si todavía no es tarea. */
  task_code: number | null;
  /**
   * Fecha límite (YYYY-MM-DD) de la tarea. Opcional: las versiones anteriores
   * de la API externa no la devolvían en el listado. Es null mientras la
   * solicitud no sea tarea, cuando la tarea no tiene fecha, y cuando la tarea
   * está marcada como interna en OPOLARITY.
   */
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  request_type: string | null;
  reporter_name: string | null;
  /** "solicitud" | "tarea" — conjunto que podría crecer, se trata como string. */
  status_source: string | null;
  /** todo | in_progress | done | blocked | cancelled | ... (ABIERTO) o null. */
  status_category: string | null;
  /** URL de la página desde donde se creó; null en lo creado antes de registrarla. */
  origin_url: string | null;
  /** Host ya normalizado por la API externa; "" cuando no hay origen. */
  origin_host: string | null;
  attachments_count: number | null;
}

/**
 * Valores existentes entre TODAS las solicitudes de la empresa (la API los
 * calcula sin aplicar los filtros activos). Con ellos se arman los selects:
 * los estados son configurables en OPOLARITY y los orígenes dependen de desde
 * dónde se creó cada solicitud, así que ninguna lista se codifica aquí.
 */
export interface SupportRequestsApiFacets {
  reporter_names: string[] | null;
  statuses: string[] | null;
  /** Hosts; "" representa las solicitudes sin origen registrado. */
  origin_hosts: string[] | null;
}

export interface SupportRequestsApiResponse {
  data: SupportRequestApiItem[];
  /** null si la API externa todavía no lo devuelve (versión anterior). */
  facets: SupportRequestsApiFacets | null;
  page: {
    current: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

/** Opción de un select de filtro: `value` es lo que viaja a la API. */
export interface SupportFilterOption {
  value: string;
  label: string;
}

export interface SupportRequestsFacets {
  reporters: SupportFilterOption[];
  statuses: SupportFilterOption[];
  origins: SupportFilterOption[];
}

/** Item adaptado para la UI. `status` se muestra TAL CUAL (es configurable). */
export interface SupportRequestListItem {
  id: string;
  /** Código de la solicitud (`S-n`); null solo si la API todavía no lo manda. */
  code: number | null;
  title: string;
  status: string;
  statusSource: string;
  statusCategory: string | null;
  requestType: SupportRequestType;
  /** Código de la tarea vinculada (`T-n`); null mientras no sea tarea. */
  taskCode: number | null;
  /** Fecha límite estimada de la tarea (YYYY-MM-DD); null si todavía no hay. */
  dueDate: string | null;
  reporterName: string | null;
  /** Host de origen ("" si no se registró): es el valor que filtra. */
  originHost: string;
  /** Nombre legible del origen ("Sin origen" cuando no hay). */
  originLabel: string;
  attachmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 * Detalle de una solicitud (edge function get-support-request)
 * ------------------------------------------------------------------ */

/** Adjunto tal como lo devuelve la edge function. */
export interface SupportAttachmentApiFile {
  id: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  /** Enlace directo de descarga: se usa TAL CUAL, no se construye a mano. */
  file_url: string;
  created_at: string;
}

/**
 * Seguimiento de la tarea. Las tareas marcadas como internas en OPOLARITY llegan
 * recortadas a code/status/status_category, así que el resto es opcional.
 */
export interface SupportTaskApiTracking {
  code: number | null;
  status: string | null;
  status_category: string | null;
  priority?: string | null;
  environments?: string[] | null;
  start_date?: string | null;
  due_date?: string | null;
  subtasks_total?: number | null;
  subtasks_done?: number | null;
  /** null cuando la tarea no tiene subtareas: NO se muestra barra en cero. */
  progress?: number | null;
}

/* ------------------------------------------------------------------ *
 * Conversación de la solicitud (hilo con el equipo de soporte)
 * ------------------------------------------------------------------ */

/** Mensaje tal como lo devuelve la edge function (snake_case, crudo). */
export interface SupportMessageApi {
  id: string;
  /** external | internal | system — conjunto ABIERTO, se trata como string. */
  origin: string | null;
  /** Nombre a mostrar; null en los mensajes de sistema. */
  author_name: string | null;
  /** Solo en los `system`: approved, rejected... En los demás, null. */
  event: string | null;
  /** TEXTO PLANO, nunca HTML: no se inserta como HTML (a diferencia de description). */
  content: string | null;
  created_at: string;
  attachments: SupportAttachmentApiFile[] | null;
}

export type SupportMessageOrigin = "external" | "internal" | "system";

/** Mensaje adaptado para la UI. */
export interface SupportMessage {
  id: string;
  origin: SupportMessageOrigin;
  authorName: string | null;
  event: string | null;
  /** Texto plano: se pinta con whitespace-pre-wrap, nunca con innerHTML. */
  content: string;
  createdAt: string;
  attachments: SupportAttachmentFile[];
}

/** Máximo por mensaje según la API externa. */
export const MAX_MESSAGE_LENGTH = 5000;

/**
 * Adjuntos al RESPONDER. No coinciden con los de crear una solicitud
 * (MAX_ATTACHMENT_BYTES, 5 MB): el endpoint de mensajes de la API externa corta
 * en 4 MB por archivo y 10 MB entre todos.
 */
export const MAX_MESSAGE_ATTACHMENTS = 5;
export const MAX_MESSAGE_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_MESSAGE_ATTACHMENTS_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB

/** Detalle tal como lo devuelve la edge function (snake_case, crudo). */
export interface SupportRequestDetailApi extends SupportRequestApiItem {
  /** HTML (viene del WysiwygEditor del formulario): se sanea antes de pintarlo. */
  description: string | null;
  attachments: SupportAttachmentApiFile[] | null;
  /** null mientras la solicitud siga en revisión. */
  reviewed_at: string | null;
  /** null mientras la solicitud no se haya convertido en tarea. */
  task: SupportTaskApiTracking | null;
  /** Hilo completo, del más antiguo al más reciente. [] si nadie escribió. */
  messages: SupportMessageApi[] | null;
  /** open | answered | closed — INDEPENDIENTE de `status` (que habla de la tarea). */
  conversation_status: string | null;
  /** null si no hay mensajes. */
  last_message_at: string | null;
}

export interface SupportRequestDetailApiResponse {
  data: SupportRequestDetailApi | null;
}

export interface SupportAttachmentFile {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  fileUrl: string;
}

export interface SupportTaskTracking {
  code: number | null;
  status: string;
  statusCategory: string | null;
  priority: string | null;
  environments: string[];
  startDate: string | null;
  dueDate: string | null;
  subtasksTotal: number | null;
  subtasksDone: number | null;
  progress: number | null;
}

/** Detalle adaptado para la UI. `status` se muestra TAL CUAL (es configurable). */
export interface SupportRequestDetail extends SupportRequestListItem {
  descriptionHtml: string | null;
  attachments: SupportAttachmentFile[];
  reviewedAt: string | null;
  task: SupportTaskTracking | null;
  messages: SupportMessage[];
  /** open | answered | closed, o null/desconocido: la UI no asume la lista. */
  conversationStatus: string | null;
  lastMessageAt: string | null;
}

/** Respuesta de la edge function que añade un mensaje al hilo. */
export interface SupportMessageApiResponse {
  data: SupportMessageApi | null;
}

/**
 * Los cuatro filtros que se editan en el modal. La búsqueda y la paginación
 * quedan fuera a propósito: la primera es un input aparte en la barra y la
 * segunda no es un filtro.
 */
export interface SupportModalFilters {
  /** null = "Todos": no se envía request_type a la API. */
  requestType: SupportRequestType | null;
  /** null = "Todos". "" es un valor válido: solicitudes sin ese dato. */
  reporterName: string | null;
  /** Nombre del estado tal cual lo devuelve la API (configurable). */
  status: string | null;
  /** Host de origen; "" = solicitudes sin origen registrado. */
  originHost: string | null;
}

export interface SupportRequestsFilters extends SupportModalFilters {
  page: number;
  size: number;
  /**
   * Texto libre: cruza título, código de solicitud (`S-21`) y código de la
   * tarea vinculada (`T-45`). "" = sin búsqueda. La API compara el prefijo ya
   * concatenado, así que "S-21", "s-21" y "21" encuentran lo mismo y aquí no
   * hay que normalizar nada.
   */
  search: string;
}

/**
 * Los códigos y la clase de error viven en shared: capacitaciones consume el
 * mismo contrato de las edge functions puente. Se reexportan con el nombre de
 * siempre para no tocar los imports del módulo.
 */
export type SupportErrorCode = EdgeFunctionErrorCode;
export { FunctionError as SupportServiceError } from "@/shared/utils/functionError";
