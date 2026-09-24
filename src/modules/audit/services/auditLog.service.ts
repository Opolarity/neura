import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/utils";
import type {
  AuditActorsApiResponse,
  AuditLogApiResponse,
  AuditLogFilters,
} from "../types/AuditLog.types";

/** Listado paginado de la auditoría (edge function get-audit-log). */
export const getAuditLogApi = async (
  filters: AuditLogFilters,
): Promise<AuditLogApiResponse> => {
  const endpoint = buildEndpoint("get-audit-log", filters);
  const data = await invokeFunction<AuditLogApiResponse>(endpoint, { method: "GET" });
  return data ?? { auditlog: null };
};

/** Usuarios que aparecen como actor (para el filtro de usuario). */
export const getAuditActorsApi = async (): Promise<AuditActorsApiResponse> => {
  const data = await invokeFunction<AuditActorsApiResponse>(
    buildEndpoint("get-audit-log", { actors: 1 }),
    { method: "GET" },
  );
  return data ?? { actors: [] };
};
