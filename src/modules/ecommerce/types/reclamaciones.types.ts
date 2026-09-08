/**
 * Tipos del libro de reclamaciones.
 *
 * El servicio antiguo no tenía tipos: normalizaba a mano ~120 alias posibles
 * por campo (`nombres` / `nombre` / `name` / `cliente_nombre`…) porque nadie
 * sabía qué devolvía realmente el SP. Ahora el contrato está fijado en
 * `sp_get_complaints_book` y `sp_get_complaint_by_id`, así que lo que llega se
 * declara una vez aquí.
 */

/** Los tres estados que acepta el CHECK de complaints_book.status. */
export type ComplaintStatus = "en_revision" | "respondido" | "no_respondido";

export const COMPLAINT_STATUS_LABEL: Record<ComplaintStatus, string> = {
  en_revision: "En revisión",
  respondido: "Respondido",
  no_respondido: "No respondido",
};

/** Filtros que viajan al backend como query string. */
export interface ComplaintsFilters {
  page?: number;
  size?: number;
  search?: string;
  status?: ComplaintStatus | "";
}

// ---------------------------------------------------------------------------
// Respuesta cruda del backend
// ---------------------------------------------------------------------------

export interface ComplaintApiRow {
  id: number;
  orden_id: string | null;
  email: string | null;
  name: string | null;
  last_name: string | null;
  last_name2: string | null;
  document_number: string | null;
  incident_date: string | null;
  created_at: string | null;
  answered_at: string | null;
  amount_claim: number | string | null;
  claim_type: string | null;
  detail: string | null;
  claim_description: string | null;
  status: ComplaintStatus;
  notes_count: number | string | null;
}

export interface ComplaintsApiResponse {
  page: { page: number; size: number; total: number };
  data: ComplaintApiRow[] | null;
}

export interface ComplaintDetailApiRow extends ComplaintApiRow {
  document_type_id: number | null;
  document_type_name: string | null;
  phone: string | null;
  age: boolean | null;
  address: string | null;
  country_id: number | null;
  country_name: string | null;
  state_id: number | null;
  state_name: string | null;
  city_id: number | null;
  city_name: string | null;
  neighborhood_id: number | null;
  neighborhood_name: string | null;
  name_apoderado: string | null;
  apoderado_document_type_id: number | null;
  apoderado_document_type_name: string | null;
  apoderado_document_number: string | null;
  apoderado_phone: string | null;
  apoderado_email: string | null;
  good: string | null;
  complaining_request: string | null;
  terms: boolean | null;
}

export interface ComplaintNoteApiRow {
  id: number;
  message: string | null;
  image_url: string | null;
  created_at: string;
  code: string | null;
  user_id: string | null;
  user_name: string | null;
}

export interface ComplaintDetailApiResponse {
  success: boolean;
  data: ComplaintDetailApiRow;
  notes: ComplaintNoteApiRow[] | null;
  error?: string;
}

/** Respuesta de `get-complaint-notes`: solo el hilo, sin el reclamo. */
export interface ComplaintNotesApiResponse {
  success: boolean;
  notes: ComplaintNoteApiRow[] | null;
  error?: string;
}

export interface CreateComplaintNoteResponse {
  success: boolean;
  note_id?: number;
  complaints_book_note_id?: number;
  /**
   * Solo viene cuando la nota se envió al reclamante: cómo quedó el reclamo
   * después de marcarlo respondido, para actualizar esos dos campos en la
   * pantalla sin recargar el detalle.
   */
  complaint?: { status: ComplaintStatus; answered_at: string | null } | null;
  error?: string;
}

export interface UpdateComplaintStatusResponse {
  success: boolean;
  id?: number;
  status?: ComplaintStatus;
  /** Cómo quedó el reclamo, para actualizar la pantalla sin recargar. */
  complaint?: { status: ComplaintStatus; answered_at: string | null } | null;
  error?: string;
}

export interface ComplaintsExportApiResponse {
  success: boolean;
  data: ComplaintExportRow[] | null;
  error?: string;
}

/** Fila del export: viene con los textos ya resueltos por el SP. */
export interface ComplaintExportRow {
  id: number;
  orden_id: string | null;
  created_at: string | null;
  status: ComplaintStatus;
  answered_at: string | null;
  name: string | null;
  last_name: string | null;
  last_name2: string | null;
  document_type_name: string | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  age: boolean | null;
  address: string | null;
  country_name: string | null;
  state_name: string | null;
  city_name: string | null;
  neighborhood_name: string | null;
  name_apoderado: string | null;
  apoderado_document_type_name: string | null;
  apoderado_document_number: string | null;
  apoderado_phone: string | null;
  apoderado_email: string | null;
  good: string | null;
  incident_date: string | null;
  amount_claim: number | string | null;
  claim_type: string | null;
  claim_description: string | null;
  detail: string | null;
  complaining_request: string | null;
  terms: boolean | null;
}

// ---------------------------------------------------------------------------
// Modelo que consume la UI
// ---------------------------------------------------------------------------

export interface Complaint {
  id: number;
  orderId: string | null;
  email: string;
  fullName: string;
  documentNumber: string;
  incidentDate: string;
  createdAt: string;
  answeredAt: string | null;
  amountClaim: number;
  /** 'queja' | 'reclamo' tal como lo guarda el formulario público. */
  claimType: string;
  detail: string;
  claimDescription: string;
  status: ComplaintStatus;
  notesCount: number;
}

export interface ComplaintDetail extends Complaint {
  phone: string;
  documentTypeName: string;
  isAdult: boolean;
  address: string;
  countryName: string;
  stateName: string;
  cityName: string;
  neighborhoodName: string;
  representativeName: string;
  representativeDocumentTypeName: string;
  representativeDocumentNumber: string;
  representativePhone: string;
  representativeEmail: string;
  good: string;
  complainingRequest: string;
  terms: boolean;
}

export interface ComplaintNote {
  id: number;
  message: string;
  imageUrl: string | null;
  createdAt: string;
  userName: string;
  /** true cuando la nota es la respuesta que se le envió al reclamante. */
  isReply: boolean;
}

export interface CreateComplaintNotePayload {
  complaint_id: number;
  message: string;
  /** true envía la nota por correo al reclamante y marca el reclamo respondido. */
  notify_customer?: boolean;
}
