import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toProcessCatalogItem } from "../adapters/processes.adapter";
import {
  ProcessCatalogFilters,
  ProcessCatalogItem,
  SaveProcessCatalogData,
} from "../types/processes.types";

interface ProcessCatalogListResponse {
  data: ProcessCatalogItem[];
  pagination: PaginationState;
}

/**
 * `is_active` viaja como "true" | "false" | "all".
 *
 * No se puede mandar el booleano tal cual: `buildEndpoint` elimina los
 * valores nulos, así que `null` (= todos) desaparecería del query string y
 * el backend lo interpretaría como "solo activos".
 */
const toIsActiveParam = (value: boolean | null | undefined): string => {
  if (value === null) return "all";
  if (value === false) return "false";
  return "true";
};

/** Las dos entidades comparten forma; solo cambia el endpoint y la clave. */
const listCatalog = async (
  endpointName: string,
  dataKey: string,
  filters: ProcessCatalogFilters
): Promise<ProcessCatalogListResponse> => {
  const { page = 1, size = 20, search, is_active } = filters;

  const endpoint = buildEndpoint(endpointName, {
    page,
    size,
    search,
    is_active: toIsActiveParam(is_active),
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const raw = data?.[dataKey] ?? { data: [], page: { page, size, total: 0 } };

  return {
    data: (raw.data ?? []).map(toProcessCatalogItem),
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};

const invokePost = async (endpointName: string, body: unknown): Promise<void> => {
  const { error } = await supabase.functions.invoke(endpointName, {
    method: "POST",
    body,
  });

  if (error) throw error;
};

// ── Procesos ────────────────────────────────────────────────────────────

export const processesListApi = (filters: ProcessCatalogFilters) =>
  listCatalog("get-processes", "processesdata", filters);

export const createProcessApi = (payload: SaveProcessCatalogData) =>
  invokePost("create-process", payload);

export const updateProcessApi = (payload: SaveProcessCatalogData) =>
  invokePost("update-process", payload);

/** Borrado lógico: deja `is_active = false`, no elimina la fila. */
export const deleteProcessApi = (id: number) => invokePost("delete-process", { id });

// ── Grupos de proceso ───────────────────────────────────────────────────

export const processGroupsListApi = (filters: ProcessCatalogFilters) =>
  listCatalog("get-process-groups", "groupsdata", filters);

export const createProcessGroupApi = (payload: SaveProcessCatalogData) =>
  invokePost("create-process-group", payload);

export const updateProcessGroupApi = (payload: SaveProcessCatalogData) =>
  invokePost("update-process-group", payload);

export const deleteProcessGroupApi = (id: number) =>
  invokePost("delete-process-group", { id });
