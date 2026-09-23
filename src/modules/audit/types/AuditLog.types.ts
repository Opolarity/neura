import type { PaginationState } from "@/shared/components/pagination/Pagination";

export type { PaginationState };

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export type AuditActorSource =
  | "jwt"
  | "sp"
  | "cron"
  | "chatbot"
  | "ecommerce"
  | "franchise"
  | "service"
  | "anon"
  | "direct";

/** Tipos de registro por los que se puede filtrar (p_entity del SP). */
export type AuditEntity = "venta" | "producto" | "cliente" | "usuario";

export type AuditData = Record<string, unknown>;

/** Fila tal cual la devuelve sp_get_audit_log. */
export interface AuditLogRowApi {
  id: number;
  created_at: string;
  table_name: string;
  row_id: string;
  action: AuditAction;
  changed_fields: string[] | null;
  old_data: AuditData | null;
  new_data: AuditData | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_source: AuditActorSource;
  actor_ref: string | null;
  txid: number;
}

export interface AuditLogApiResponse {
  success?: boolean;
  auditlog?: {
    data: AuditLogRowApi[] | null;
    page: { page: number; size: number; total: number };
  } | null;
}

export interface AuditActorsApiResponse {
  success?: boolean;
  actors?: AuditActor[] | null;
}

export interface AuditActor {
  id: string;
  name: string;
}

/** Fila lista para la UI. */
export interface AuditLogEntry {
  id: number;
  createdAt: string;
  dateLabel: string;
  tableName: string;
  tableLabel: string;
  rowId: string;
  recordLabel: string;
  action: AuditAction;
  changedFields: string[];
  changedLabel: string;
  oldData: AuditData | null;
  newData: AuditData | null;
  actorId: string | null;
  actorLabel: string;
  actorSource: AuditActorSource;
  actorRef: string | null;
  txid: number;
}

/** Filtros que viajan como querystring a get-audit-log. */
export interface AuditLogFilters {
  page: number;
  size: number;
  search: string | null;
  start_date: string | null;
  end_date: string | null;
  table: string | null;
  action: AuditAction | null;
  actor_source: AuditActorSource | null;
  actor_id: string | null;
  entity: AuditEntity | null;
  entity_id: string | null;
  txid?: number | null;
}

/** Una línea de la tabla "Campo / Antes / Después" del detalle. */
export interface AuditFieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}
