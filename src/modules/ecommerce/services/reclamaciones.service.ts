/**
 * Libro de reclamaciones — acceso a las edge functions.
 *
 * Se pasa a `buildEndpoint` + `invokeFunction` con `method: "GET"`, que es el
 * patrón del resto del ERP (ver `customers/services/Account.services.ts`). El
 * servicio anterior mandaba los filtros en el body a una function que los leía
 * de la query string: nunca llegaban, así que el backend devolvía siempre la
 * primera página sin filtrar y la paginación se hacía en cliente sobre esas 20
 * filas.
 */
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import type {
  ComplaintDetailApiResponse,
  ComplaintStatus,
  ComplaintsApiResponse,
  ComplaintsExportApiResponse,
  ComplaintsFilters,
  CreateComplaintNotePayload,
} from "../types/reclamaciones.types";

const EMPTY_LIST: ComplaintsApiResponse = {
  page: { page: 1, size: 20, total: 0 },
  data: [],
};

export const getComplaintsApi = async (
  filters: ComplaintsFilters,
): Promise<ComplaintsApiResponse> => {
  const endpoint = buildEndpoint("get-complaints-book", filters);

  const data = await invokeFunction<ComplaintsApiResponse>(endpoint, {
    method: "GET",
  });

  return data ?? EMPTY_LIST;
};

export const getComplaintDetailApi = async (
  id: number,
): Promise<ComplaintDetailApiResponse> => {
  const endpoint = buildEndpoint("get-complaint-detail", { id });

  return await invokeFunction<ComplaintDetailApiResponse>(endpoint, {
    method: "GET",
  });
};

export const createComplaintNoteApi = async (
  payload: CreateComplaintNotePayload,
) => {
  return await invokeFunction("create-complaint-note", {
    method: "POST",
    body: payload,
  });
};

export const updateComplaintStatusApi = async (
  complaintId: number,
  status: ComplaintStatus,
) => {
  return await invokeFunction("update-complaint-status", {
    method: "POST",
    body: { complaint_id: complaintId, status },
  });
};

export const getComplaintsExportApi = async (
  filters: Pick<ComplaintsFilters, "search" | "status">,
): Promise<ComplaintsExportApiResponse> => {
  const endpoint = buildEndpoint("get-complaints-book-export", filters);

  return await invokeFunction<ComplaintsExportApiResponse>(endpoint, {
    method: "GET",
  });
};
