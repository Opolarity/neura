import { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  Complaint,
  ComplaintApiRow,
  ComplaintDetail,
  ComplaintDetailApiRow,
  ComplaintNote,
  ComplaintNoteApiRow,
  ComplaintsApiResponse,
} from "../types/reclamaciones.types";

/** El code con el que se guarda la respuesta enviada al reclamante. */
const REPLY_NOTE_CODE = "CBK-ANS";

const toNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fullNameOf = (row: { name: string | null; last_name: string | null; last_name2: string | null }) =>
  [row.name, row.last_name, row.last_name2].filter(Boolean).join(" ").trim();

const complaintFromRow = (row: ComplaintApiRow): Complaint => ({
  id: toNumber(row.id),
  orderId: row.orden_id ?? null,
  email: row.email ?? "",
  fullName: fullNameOf(row),
  documentNumber: row.document_number ?? "",
  incidentDate: row.incident_date ?? "",
  createdAt: row.created_at ?? "",
  answeredAt: row.answered_at ?? null,
  amountClaim: toNumber(row.amount_claim),
  claimType: (row.claim_type ?? "").trim().toLowerCase(),
  detail: row.detail ?? "",
  claimDescription: row.claim_description ?? "",
  status: row.status,
  notesCount: toNumber(row.notes_count),
});

export const reclamacionesAdapter = (response: ComplaintsApiResponse) => {
  const data: Complaint[] = (response?.data ?? []).map(complaintFromRow);

  const pagination: PaginationState = {
    p_page: response?.page?.page ?? 1,
    p_size: response?.page?.size ?? 20,
    total: response?.page?.total ?? 0,
  };

  return { data, pagination };
};

export const reclamacionDetalleAdapter = (
  row: ComplaintDetailApiRow,
): ComplaintDetail => ({
  ...complaintFromRow(row),
  phone: row.phone ?? "",
  documentTypeName: row.document_type_name ?? "",
  // age es booleano en la BD: true = mayor de edad. De ahí que el bloque del
  // apoderado solo tenga sentido cuando es false.
  isAdult: row.age === true,
  address: row.address ?? "",
  countryName: row.country_name ?? "",
  stateName: row.state_name ?? "",
  cityName: row.city_name ?? "",
  neighborhoodName: row.neighborhood_name ?? "",
  representativeName: row.name_apoderado ?? "",
  representativeDocumentTypeName: row.apoderado_document_type_name ?? "",
  representativeDocumentNumber: row.apoderado_document_number ?? "",
  representativePhone: row.apoderado_phone ?? "",
  representativeEmail: row.apoderado_email ?? "",
  good: row.good ?? "",
  complainingRequest: row.complaining_request ?? "",
  terms: row.terms === true,
});

export const reclamacionNotasAdapter = (
  rows: ComplaintNoteApiRow[] | null,
): ComplaintNote[] =>
  (rows ?? []).map((row) => ({
    id: toNumber(row.id),
    message: row.message ?? "",
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at,
    userName: row.user_name?.trim() || "Usuario",
    isReply: row.code === REPLY_NOTE_CODE,
  }));
