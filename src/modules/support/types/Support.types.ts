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
