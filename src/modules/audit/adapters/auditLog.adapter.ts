import { formatDateTime } from "@/shared/utils/date";
import {
  AUDIT_SOURCE_LABELS,
  fieldLabel,
  tableLabel,
} from "../constants/auditLabels";
import type {
  AuditLogApiResponse,
  AuditLogEntry,
  AuditLogRowApi,
  PaginationState,
} from "../types/AuditLog.types";

const shortId = (id: string): string => (id.length > 12 ? `${id.slice(0, 8)}…` : id);

const changedLabel = (row: AuditLogRowApi, fields: string[]): string => {
  if (row.action !== "UPDATE") return "—";
  if (fields.length === 0) return "—";
  if (fields.length <= 3) return fields.map(fieldLabel).join(", ");
  return `${fields.slice(0, 2).map(fieldLabel).join(", ")} y ${fields.length - 2} más`;
};

export const auditLogEntryAdapter = (row: AuditLogRowApi): AuditLogEntry => {
  const fields = row.changed_fields ?? [];
  const sourceLabel = AUDIT_SOURCE_LABELS[row.actor_source] ?? row.actor_source;

  return {
    id: row.id,
    createdAt: row.created_at,
    dateLabel: formatDateTime(row.created_at),
    tableName: row.table_name,
    tableLabel: tableLabel(row.table_name),
    rowId: row.row_id,
    recordLabel: `${tableLabel(row.table_name)} #${shortId(row.row_id)}`,
    action: row.action,
    changedFields: fields,
    changedLabel: changedLabel(row, fields),
    oldData: row.old_data,
    newData: row.new_data,
    actorId: row.actor_id,
    // Sin usuario conocido (chatbot, cron, ecommerce…) se muestra el origen.
    actorLabel: row.actor_name ?? (row.actor_id ? shortId(row.actor_id) : sourceLabel),
    actorSource: row.actor_source,
    actorRef: row.actor_ref,
    txid: row.txid,
  };
};

export const auditLogAdapter = (
  response: AuditLogApiResponse,
): { entries: AuditLogEntry[]; pagination: PaginationState } => {
  const payload = response.auditlog;
  return {
    entries: (payload?.data ?? []).map(auditLogEntryAdapter),
    pagination: {
      p_page: payload?.page?.page ?? 1,
      p_size: payload?.page?.size ?? 20,
      total: payload?.page?.total ?? 0,
    },
  };
};
