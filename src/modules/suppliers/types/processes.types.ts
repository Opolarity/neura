/**
 * Catálogos de procesos.
 *
 * `processes` y `process_group` comparten forma y pantalla, de ahí que
 * compartan tipos. El grupo ("procesos de pantalones") se decide en la orden
 * de producción, no aquí; su cruce vive en `production_order_info`.
 *
 * El GRUPO (menú «Procesos») es la etapa de la receta y de la orden ("Corte",
 * "Confección"). Las OPERACIONES (tabla `processes`) ya no cuelgan de un
 * proceso: desde el pase de multicliente (2026-11) se agrupan por una OPERACIÓN PADRE
 * ("Ensamble" → "Volt. prenda para basta"), de un solo nivel, y cualquiera
 * puede ir en cualquier etapa.
 */

/** Fila de cualquiera de los dos catálogos. */
export interface ProcessCatalogItem {
  id: number;
  name: string;
  code: string | null;
  isActive: boolean;
  /**
   * Solo operaciones: la operación PADRE que la agrupa. `null` = es un padre
   * o una operación suelta (o la fila es un proceso, que no se agrupa).
   */
  parentProcessId: number | null;
  /** Nombre del padre, para pintarlo sin otra consulta. */
  parentProcessName: string | null;
  /**
   * Solo operaciones: cuántas operaciones activas agrupa.
   */
  childrenCount: number;
  /**
   * Solo procesos (grupos): por defecto del servicio de confección (Corte,
   * Costura, Acabado) y su orden en la ruta (2026-10-14).
   */
  isEssential: boolean;
  essentialOrder: number | null;
  /**
   * Corte, Costura y Acabado (los marcados por defecto): fijos, no se
   * editan ni se borran.
   */
  isDefault: boolean;
  /** Veces que se usa en `production_order_info`. */
  usageCount: number;
  createdAt: string;
}

/** `true` solo activos, `false` solo inactivos, `null` todos. */
export type ActiveFilter = boolean | null;

export interface ProcessCatalogFilters {
  search?: string | null;
  is_active?: ActiveFilter;
  page?: number;
  size?: number;
}

/** Campos del modal de alta/edición. Iguales para proceso y grupo. */
export interface ProcessCatalogFormValues {
  id?: number;
  name: string;
  code?: string | null;
  /** Solo operaciones: la operación padre. */
  parentProcessId?: number | null;
}

export interface SaveProcessCatalogData {
  id?: number;
  name: string;
  code?: string | null;
  /**
   * Solo operaciones. Va en snake_case porque el service reenvía el payload
   * tal cual a la edge function. Al editar, null le quita el padre; ausente
   * no lo toca.
   */
  parent_process_id?: number | null;
}
