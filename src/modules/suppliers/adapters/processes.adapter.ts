import { ProcessCatalogItem } from "../types/processes.types";

const toTextOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
};

/**
 * Fila de sp_get_processes o sp_get_process_groups → modelo de UI.
 *
 * Las dos entidades tienen la misma forma, así que comparten adapter.
 */
export const toProcessCatalogItem = (row: any): ProcessCatalogItem => ({
  id: row.id,
  name: row.name ?? "",
  code: toTextOrNull(row.code),
  isActive: row.is_active ?? true,
  // Solo lo devuelven los procesos (sp_get_processes): a qué grupo pertenece
  // la operación. Los grupos no lo traen, así que cae a null.
  processGroupId: row.process_group_id ?? null,
  processGroupName: toTextOrNull(row.process_group_name),
  usageCount: Number(row.usage_count ?? 0),
  createdAt: row.created_at ?? "",
});
