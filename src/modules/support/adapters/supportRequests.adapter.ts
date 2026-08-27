import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  SupportRequestListItem,
  SupportRequestsApiResponse,
  SupportRequestsFacets,
} from "../types/Support.types";
import { originHostFromUrl, originLabelFromHost } from "../utils/originLabel";

/** Facets vacíos: la vista siempre recibe la misma forma, aunque la API no los mande. */
const EMPTY_FACETS: SupportRequestsFacets = {
  reporters: [],
  statuses: [],
  origins: [],
};

/**
 * Adapta la respuesta de get-support-requests a la forma que consume la UI.
 * Defensivo a propósito: los estados de OPOLARITY son configurables y el
 * payload podría ganar campos, así que nada se valida contra listas cerradas.
 */
export const adaptSupportRequestsResponse = (
  response: SupportRequestsApiResponse,
): {
  requests: SupportRequestListItem[];
  pagination: PaginationState;
  facets: SupportRequestsFacets;
} => {
  const requests: SupportRequestListItem[] = (response?.data ?? []).map((item) => {
    // origin_host lo normaliza la API; si no viene (versión anterior del
    // endpoint) se deriva de la URL con el mismo criterio.
    const originHost =
      item.origin_host?.trim().toLowerCase() || originHostFromUrl(item.origin_url);

    return {
      id: item.id,
      // Los dos códigos llegan como número; el prefijo S-/T- lo pone la UI
      code: item.code ?? null,
      title: item.title?.trim() || "(Sin título)",
      // Texto crudo: nunca se traduce ni se mapea a una lista fija
      status: item.status?.trim() || "Sin estado",
      statusSource: item.status_source ?? "solicitud",
      statusCategory: item.status_category ?? null,
      requestType: item.request_type === "ticket" ? "ticket" : "suggestion",
      taskCode: item.task_code ?? null,
      dueDate: item.due_date ?? null,
      reporterName: item.reporter_name ?? null,
      originHost,
      originLabel: originLabelFromHost(originHost),
      attachmentsCount: item.attachments_count ?? 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  });

  const pagination: PaginationState = {
    p_page: response?.page?.current ?? 1,
    p_size: response?.page?.size ?? 20,
    total: response?.page?.total ?? 0,
  };

  return { requests, pagination, facets: adaptFacets(response) };
};

/** Convierte los facets crudos en opciones de select, sin duplicados ni vacíos raros. */
const adaptFacets = (response: SupportRequestsApiResponse): SupportRequestsFacets => {
  const facets = response?.facets;
  if (!facets) return EMPTY_FACETS;

  const clean = (values: string[] | null | undefined) =>
    Array.from(new Set((values ?? []).map((value) => value?.trim() ?? "")));

  return {
    // "" = sin reportante; la API lo devuelve como un valor más
    reporters: clean(facets.reporter_names).map((value) => ({
      value,
      label: value || "Sin reportante",
    })),
    statuses: clean(facets.statuses)
      .filter((value) => value !== "")
      .map((value) => ({ value, label: value })),
    origins: clean(facets.origin_hosts).map((value) => ({
      value,
      label: originLabelFromHost(value),
    })),
  };
};
