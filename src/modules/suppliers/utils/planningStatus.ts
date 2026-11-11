import { BadgeProps } from "@/components/ui/badge";
import {
  CutState,
  MasterPlanProcessStatus,
  MasterPlanStageKey,
  MasterPlanStageStatus,
  MasterPlanState,
  MasterPlanStateFilter,
} from "../types/planning.types";

/**
 * Cómo se rotula y se pinta el estado en el Plan de producción: un solo
 * lugar para que la pantalla y el Excel digan lo mismo.
 * `pending` lo que espera, `info` lo que va en marcha, `destructive-soft` lo
 * que va tarde y `success` lo terminado.
 */
export const MASTER_PLAN_STATES: Record<MasterPlanState, { label: string; variant: BadgeProps["variant"] }> = {
  PENDING: { label: "Pendiente", variant: "pending" },
  IN_PROGRESS: { label: "En proceso", variant: "info" },
  LATE: { label: "Retrasado", variant: "destructive-soft" },
  DONE: { label: "Terminado", variant: "success" },
};

/** Las opciones del filtro, en el orden en que se lee una orden. */
export const MASTER_PLAN_FILTERS: Array<{ value: MasterPlanStateFilter; label: string }> = [
  { value: "OPEN", label: "Sin terminar" },
  { value: "PENDING", label: "Pendientes" },
  { value: "IN_PROGRESS", label: "En proceso" },
  { value: "LATE", label: "Retrasados" },
  { value: "DONE", label: "Terminados" },
];

/** El badge de un proceso: tarde manda sobre «en proceso». */
export const processBadge = (
  status: MasterPlanProcessStatus,
  lateDays: number,
  percent: number | null
): { label: string; variant: BadgeProps["variant"] } => {
  if (status === "DONE") return { label: "Terminado", variant: "success" };
  const avance = percent !== null && percent > 0 ? ` ${Math.round(percent)}%` : "";
  if (lateDays > 0) return { label: `${lateDays} d tarde${avance ? " ·" + avance : ""}`, variant: "destructive-soft" };
  if (status === "IN_PROGRESS") return { label: `En proceso${avance}`, variant: "info" };
  return { label: "Pendiente", variant: "pending" };
};

/** El estado del corte de una línea, como en el Maestro («x Cortar»). */
export const CUT_STATES: Record<CutState, { label: string; variant: BadgeProps["variant"] }> = {
  TO_CUT: { label: "x Cortar", variant: "pending" },
  PARTIAL: { label: "Corte parcial", variant: "info" },
  CUT: { label: "Cortado", variant: "success" },
  NA: { label: "No aplica", variant: "secondary" },
};

type StageBadge = { label: string; variant: BadgeProps["variant"] };
const NO_APLICA: StageBadge = { label: "No aplica", variant: "secondary" };

/**
 * Los bloques del plan con las palabras de la planilla del taller:
 * x Cortar / Cortado, x Costura / Proceso / Terminado, x Acabado / Proceso /
 * Terminado. Un corte a medias sigue «x Cortar»: su % de corte dice cuánto va.
 */
export const STAGE_STATES: Record<MasterPlanStageKey, Record<MasterPlanStageStatus, StageBadge>> = {
  cut: {
    NA: NO_APLICA,
    PENDING: { label: "x Cortar", variant: "pending" },
    IN_PROGRESS: { label: "x Cortar", variant: "pending" },
    DONE: { label: "Cortado", variant: "success" },
  },
  sewing: {
    NA: NO_APLICA,
    PENDING: { label: "x Costura", variant: "pending" },
    IN_PROGRESS: { label: "Proceso", variant: "info" },
    DONE: { label: "Terminado", variant: "success" },
  },
  finishing: {
    NA: NO_APLICA,
    PENDING: { label: "x Acabado", variant: "pending" },
    IN_PROGRESS: { label: "Proceso", variant: "info" },
    DONE: { label: "Terminado", variant: "success" },
  },
};

/** Quién hace el bloque: el taller proveedor del encargo, o «Sin encargo». */
export const stageWorkshop = (stage: { workshop: string | null }, corto: (name: string | null) => string | null) =>
  corto(stage.workshop) ?? "Sin encargo";
