import { ComboboxOption } from "../components/EntityCombobox";
import { ProcessCatalogItem } from "../types/processes.types";

/**
 * Catálogo de operaciones para los selectores (receta, ruta de la orden,
 * encargos).
 *
 * Desde el pase de multicliente (2026-11) una operación ya no pertenece a un Proceso: se agrupa
 * por su OPERACIÓN PADRE (un solo nivel) y puede ir en cualquier etapa. Los
 * selectores ofrecen el catálogo entero agrupado por padre
 * («Ensamble › Volt. prenda para basta»). Un padre que agrupa operaciones no
 * se ofrece como paso: es el nombre del grupo, no un trabajo.
 */
export interface OperationCatalogEntry {
  processId: number;
  processName: string;
  parentProcessId: number | null;
  parentProcessName: string | null;
  /**
   * Agrupa otras operaciones activas: no se elige como paso.
   */
  hasChildren: boolean;
}

export const toOperationCatalogEntry = (item: ProcessCatalogItem): OperationCatalogEntry => ({
  processId: item.id,
  processName: item.name,
  parentProcessId: item.parentProcessId,
  parentProcessName: item.parentProcessName,
  hasChildren: item.childrenCount > 0,
});

/** «Padre › Operación», o solo la operación si no tiene padre. */
export const operationLabel = (entry: Pick<OperationCatalogEntry, "processName" | "parentProcessName">) =>
  entry.parentProcessName ? `${entry.parentProcessName} › ${entry.processName}` : entry.processName;

/** Las que se pueden elegir como paso, ordenadas por grupo y nombre. */
export const selectableOperations = (catalog: OperationCatalogEntry[]): OperationCatalogEntry[] =>
  catalog
    .filter((entry) => !entry.hasChildren)
    .sort((a, b) => operationLabel(a).localeCompare(operationLabel(b), "es"));

/** Opciones de combobox, sin las que ya están puestas. */
export const operationComboboxOptions = (
  catalog: OperationCatalogEntry[],
  excludeIds: number[] = []
): ComboboxOption[] =>
  selectableOperations(catalog)
    .filter((entry) => !excludeIds.includes(entry.processId))
    .map((entry) => ({ id: entry.processId, label: operationLabel(entry) }));

/** Lo que el formulario de alta necesita para ofrecer padres. */
export const parentOptionsFrom = (catalog: OperationCatalogEntry[]) =>
  catalog
    .filter((entry) => entry.parentProcessId === null)
    .map((entry) => ({ id: entry.processId, name: entry.processName, parentProcessId: null }));
