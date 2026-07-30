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
  title: string | null;
  /** "recibido" | "rechazado" | nombre del estado de la tarea (configurable). */
  status: string | null;
  task_code: string | null;
  created_at: string;
  updated_at: string;
  request_type: string | null;
  reporter_name: string | null;
  /** "solicitud" | "tarea" — conjunto que podría crecer, se trata como string. */
  status_source: string | null;
  /** todo | in_progress | done | blocked | cancelled | ... (ABIERTO) o null. */
  status_category: string | null;
  attachments_count: number | null;
}

export interface SupportRequestsApiResponse {
  data: SupportRequestApiItem[];
  page: {
    current: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

/** Item adaptado para la UI. `status` se muestra TAL CUAL (es configurable). */
export interface SupportRequestListItem {
  id: string;
  title: string;
  status: string;
  statusSource: string;
  statusCategory: string | null;
  requestType: SupportRequestType;
  taskCode: string | null;
  reporterName: string | null;
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

/** Detalle tal como lo devuelve la edge function (snake_case, crudo). */
export interface SupportRequestDetailApi extends SupportRequestApiItem {
  /** HTML (viene del WysiwygEditor del formulario): se sanea antes de pintarlo. */
  description: string | null;
  attachments: SupportAttachmentApiFile[] | null;
  /** null mientras la solicitud siga en revisión. */
  reviewed_at: string | null;
  /** null mientras la solicitud no se haya convertido en tarea. */
  task: SupportTaskApiTracking | null;
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
}

export interface SupportRequestsFilters {
  page: number;
  size: number;
  /** null = "Todos": no se envía request_type a la API. */
  requestType: SupportRequestType | null;
}

export type SupportErrorCode =
  | "not_configured"
  | "unauthorized"
  | "invalid_api_key"
  | "client_not_found"
  | "company_document"
  | "bad_request"
  | "not_found"
  | "upstream_error"
  | "upstream_unreachable"
  | "server_config"
  | "network_error"
  | "unknown";

/** Error con código, para poder mostrar mensajes distintos dentro de la vista. */
export class SupportServiceError extends Error {
  code: SupportErrorCode;

  constructor(message: string, code: SupportErrorCode = "unknown") {
    super(message);
    this.name = "SupportServiceError";
    this.code = code;
  }
}
