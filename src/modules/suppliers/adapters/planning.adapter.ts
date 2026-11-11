import {
  CutState,
  MasterPlanLine,
  MasterPlanLineSize,
  MasterPlanLinesResponse,
  MasterPlanProcessStatus,
  MasterPlanStage,
  MasterPlanStageStatus,
  MasterPlanState,
} from "../types/planning.types";

type Raw = Record<string, unknown>;

const num = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const numOrNull = (value: unknown): number | null =>
  value === undefined || value === null || value === "" ? null : Number(value);
const textOrNull = (value: unknown): string | null =>
  value === undefined || value === null || value === "" ? null : String(value);
const list = (value: unknown): Raw[] => (Array.isArray(value) ? (value as Raw[]) : []);

const STATES: MasterPlanState[] = ["PENDING", "IN_PROGRESS", "LATE", "DONE"];
const toState = (value: unknown): MasterPlanState =>
  STATES.includes(value as MasterPlanState) ? (value as MasterPlanState) : "PENDING";

const toProcessStatus = (value: unknown): MasterPlanProcessStatus =>
  value === "DONE" || value === "IN_PROGRESS" ? value : "PENDING";

const CUT_STATES: CutState[] = ["TO_CUT", "PARTIAL", "CUT", "NA"];

const STAGE_STATUSES: MasterPlanStageStatus[] = ["NA", "PENDING", "IN_PROGRESS", "DONE"];

/** Un bloque del plan; sin dato, no aplica. */
const toStage = (value: unknown): MasterPlanStage => {
  const row = (value ?? {}) as Raw;
  return {
    applies: row.applies === true,
    workshop: textOrNull(row.workshop),
    plannedStart: textOrNull(row.planned_start),
    plannedEnd: textOrNull(row.planned_end),
    actualEnd: textOrNull(row.actual_end),
    requested: numOrNull(row.requested),
    advanced: numOrNull(row.advanced),
    percent: numOrNull(row.percent),
    status: STAGE_STATUSES.includes(row.status as MasterPlanStageStatus) ? (row.status as MasterPlanStageStatus) : "NA",
  };
};

const toLineSize = (row: Raw): MasterPlanLineSize => ({
  sizeTermId: numOrNull(row.size_term_id),
  size: textOrNull(row.size),
  quantity: num(row.quantity),
});

const toLine = (row: Raw): MasterPlanLine => {
  const category = (row.category ?? {}) as Raw;
  return {
    productionOrderId: num(row.production_order_id),
    productionOrderCode: textOrNull(row.production_order_code),
    productionOrderName: textOrNull(row.production_order_name),
    issueDate: textOrNull(row.issue_date),
    promisedDate: textOrNull(row.promised_date),
    cutOrderId: numOrNull(row.cut_order_id),
    cutCode: textOrNull(row.cut_code),
    line: textOrNull(category.line),
    family: textOrNull(category.family),
    productId: numOrNull(row.product_id),
    model: String(row.model ?? "Sin estilo"),
    modelTitle: textOrNull(row.model_title),
    color: textOrNull(row.color),
    sizes: list(row.sizes).map(toLineSize),
    quantity: num(row.quantity),
    cutDone: num(row.cut_done),
    cutState: CUT_STATES.includes(row.cut_state as CutState) ? (row.cut_state as CutState) : "TO_CUT",
    cutDate: textOrNull(row.cut_date),
    week: numOrNull(row.week),
    processes: list(row.processes).map((p) => ({
      processGroupId: numOrNull(p.process_group_id),
      name: String(p.name ?? "Proceso"),
      isEssential: p.is_essential === true,
      supplierName: textOrNull(p.supplier_name),
      promisedDate: textOrNull(p.promised_date),
      endDate: textOrNull(p.end_date),
      lateDays: num(p.late_days),
      requested: num(p.requested),
      advanced: num(p.advanced),
      status: toProcessStatus(p.status),
    })),
    stages: {
      cut: toStage((row.stages as Raw | undefined)?.cut),
      sewing: toStage((row.stages as Raw | undefined)?.sewing),
      finishing: toStage((row.stages as Raw | undefined)?.finishing),
    },
    state: toState(row.state),
    lateDays: num(row.late_days),
    notes: textOrNull(row.notes),
  };
};

/** Respuesta de sp_get_master_plan_lines → modelo de UI. */
export const toMasterPlanLines = (raw: Raw | null | undefined): MasterPlanLinesResponse => {
  const page = (raw?.page ?? {}) as Raw;
  const totals = (raw?.totals ?? {}) as Raw;
  return {
    data: list(raw?.data).map(toLine),
    pagination: { p_page: num(page.page) || 1, p_size: num(page.size) || 20, total: num(page.total) },
    processes: list(raw?.processes).map((p) => ({
      processGroupId: num(p.process_group_id),
      name: String(p.name ?? "Proceso"),
    })),
    sizes: list(raw?.sizes).map((s) => ({ sizeTermId: numOrNull(s.size_term_id), size: textOrNull(s.size) })),
    totals: { quantity: num(totals.quantity), sizes: list(totals.sizes).map(toLineSize) },
  };
};
