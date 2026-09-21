/**
 * Catálogos de procesos.
 *
 * `processes` y `process_group` comparten forma y pantalla, de ahí que
 * compartan tipos. El grupo ("procesos de pantalones") se decide en la orden
 * de producción, no aquí; su cruce vive en `production_order_info`.
 *
 * La jerarquía es entre las dos tablas: el GRUPO es la etapa padre
 * ("Corte", "Confección") y cada PROCESO es una operación que pertenece a un
 * grupo ("Tendido", "Trazado"). Los grupos no se agrupan entre sí.
 */

/** Fila de cualquiera de los dos catálogos. */
export interface ProcessCatalogItem {
  id: number;
  name: string;
  code: string | null;
  isActive: boolean;
  /**
   * Grupo (etapa) al que pertenece esta operación. `null` = la operación aún
   * no cuelga de ningún grupo (o la fila es un grupo, que no se agrupa).
   */
  processGroupId: number | null;
  /** Nombre del grupo, para pintarlo sin otra consulta. */
  processGroupName: string | null;
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
  /** Solo procesos: grupo (etapa) al que pertenece la operación. */
  processGroupId?: number | null;
}

export interface SaveProcessCatalogData {
  id?: number;
  name: string;
  code?: string | null;
  /**
   * Solo procesos. Va en snake_case porque el service reenvía el payload tal
   * cual a la edge function, que espera `process_group_id`.
   */
  process_group_id?: number | null;
}
