import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  SupportRequestListItem,
  SupportRequestsApiResponse,
} from "../types/Support.types";

/**
 * Adapta la respuesta de get-support-requests a la forma que consume la UI.
 * Defensivo a propósito: los estados de OPOLARITY son configurables y el
 * payload podría ganar campos, así que nada se valida contra listas cerradas.
 */
export const adaptSupportRequestsResponse = (
  response: SupportRequestsApiResponse,
): { requests: SupportRequestListItem[]; pagination: PaginationState } => {
  const requests: SupportRequestListItem[] = (response?.data ?? []).map((item) => ({
    id: item.id,
    title: item.title?.trim() || "(Sin título)",
    // Texto crudo: nunca se traduce ni se mapea a una lista fija
    status: item.status?.trim() || "Sin estado",
    statusSource: item.status_source ?? "solicitud",
    statusCategory: item.status_category ?? null,
    requestType: item.request_type === "ticket" ? "ticket" : "suggestion",
    taskCode: item.task_code ?? null,
    reporterName: item.reporter_name ?? null,
    attachmentsCount: item.attachments_count ?? 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  const pagination: PaginationState = {
    p_page: response?.page?.current ?? 1,
    p_size: response?.page?.size ?? 20,
    total: response?.page?.total ?? 0,
  };

  return { requests, pagination };
};
