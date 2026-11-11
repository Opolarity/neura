/**
 * Plan de producción (pase MC → personalizado, 2026-11-11): la vista de solo
 * lectura de multicliente (sp_get_master_plan_lines), con el formato del
 * «Maestro Programa de Producción». Reemplaza al Plan maestro operable: lo que
 * se registra (avances, recepciones, pagos) se registra en la OP.
 *
 * Adaptado a Overtake, que produce con talleres proveedores y no maquila para
 * clientes: sin cliente, OS cliente, O/P cliente, cumplimiento de entrega ni
 * despacho, y sin taller propio (todo bloque lo hace un taller externo).
 * Los símbolos se llaman `MasterPlan*`, como en multicliente, para que el
 * pase siguiente sea un diff y no una traducción.
 */

/** El estado de la OP en el plan. OPEN es solo filtro: todo lo que no terminó. */
export type MasterPlanState = "PENDING" | "IN_PROGRESS" | "LATE" | "DONE";
export type MasterPlanStateFilter = MasterPlanState | "OPEN";

export type MasterPlanProcessStatus = "PENDING" | "IN_PROGRESS" | "DONE";

/** NA = la OP no corta: sin paso de Corte ni orden de corte. */
export type CutState = "TO_CUT" | "PARTIAL" | "CUT" | "NA";

export interface MasterPlanSizeColumn {
  sizeTermId: number | null;
  /** La talla escrita; null = prendas sin talla. */
  size: string | null;
}

export interface MasterPlanLineSize extends MasterPlanSizeColumn {
  quantity: number;
}

/** Un proceso de la ruta para las prendas de la línea. */
export interface MasterPlanLineProcess {
  processGroupId: number | null;
  name: string;
  /** Los esenciales (Corte, Costura, Acabado) van en su bloque. */
  isEssential: boolean;
  supplierName: string | null;
  promisedDate: string | null;
  endDate: string | null;
  lateDays: number;
  requested: number;
  advanced: number;
  status: MasterPlanProcessStatus;
}

/**
 * Los tres bloques del plan, como en la planilla del taller: Corte, Costura
 * y Acabado. NA = la OP no hace ese servicio.
 */
export type MasterPlanStageKey = "cut" | "sewing" | "finishing";
export type MasterPlanStageStatus = "NA" | "PENDING" | "IN_PROGRESS" | "DONE";

export interface MasterPlanStage {
  applies: boolean;
  /** El taller proveedor del encargo; null si aún no hay encargo. */
  workshop: string | null;
  /** Inicio programado (de la ruta). */
  plannedStart: string | null;
  /** Fin programado: lo pactado en el encargo. */
  plannedEnd: string | null;
  /** Fin real; en Corte, el día del corte; en Costura, la recepción del proveedor. */
  actualEnd: string | null;
  /** En Corte: lo pedido y lo cortado. En el resto: lo que pasa por el paso y lo avanzado. */
  requested: number | null;
  advanced: number | null;
  percent: number | null;
  status: MasterPlanStageStatus;
}

export interface MasterPlanLine {
  productionOrderId: number;
  productionOrderCode: string | null;
  productionOrderName: string | null;
  issueDate: string | null;
  promisedDate: string | null;
  cutOrderId: number | null;
  /** La O/C: la orden de corte. */
  cutCode: string | null;
  line: string | null;
  family: string | null;
  productId: number | null;
  model: string;
  modelTitle: string | null;
  color: string | null;
  sizes: MasterPlanLineSize[];
  quantity: number;
  cutDone: number;
  cutState: CutState;
  cutDate: string | null;
  week: number | null;
  processes: MasterPlanLineProcess[];
  stages: Record<MasterPlanStageKey, MasterPlanStage>;
  state: MasterPlanState;
  lateDays: number;
  notes: string | null;
}

export interface MasterPlanLinesFilters {
  search: string;
  state: MasterPlanStateFilter | null;
  cutState: CutState | null;
  week: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface MasterPlanLinesResponse {
  data: MasterPlanLine[];
  pagination: { p_page: number; p_size: number; total: number };
  /** Los procesos esenciales, en su orden: un bloque cada uno. */
  processes: Array<{ processGroupId: number; name: string }>;
  /** Las tallas de la página, en orden. */
  sizes: MasterPlanSizeColumn[];
  /** Totales de todo el filtro, no solo de la página. */
  totals: { quantity: number; sizes: MasterPlanLineSize[] };
}
