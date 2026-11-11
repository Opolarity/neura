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
  // Solo lo devuelven las operaciones (sp_get_processes): su operación padre.
  // Los procesos (grupos) no lo traen, así que cae a null.
  parentProcessId: row.parent_process_id ?? null,
  parentProcessName: toTextOrNull(row.parent_process_name),
  childrenCount: Number(row.children_count ?? 0),
  // Solo los devuelve el catálogo de procesos (sp_get_process_groups).
  isEssential: row.is_essential === true,
  essentialOrder:
    row.essential_order === undefined || row.essential_order === null ? null : Number(row.essential_order),
  isDefault: row.is_default === true,
  usageCount: Number(row.usage_count ?? 0),
  createdAt: row.created_at ?? "",
});
