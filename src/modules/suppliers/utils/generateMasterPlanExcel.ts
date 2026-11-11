import * as XLSX from "xlsx";
import { getTodayDate } from "@/shared/utils/date";
import { MasterPlanLine, MasterPlanLinesResponse, MasterPlanSizeColumn, MasterPlanStageKey } from "../types/planning.types";
import { MASTER_PLAN_STATES, STAGE_STATES, stageWorkshop } from "./planningStatus";
import { tallerCorto } from "./routeServiceSchedule";

/** Misma clave que en pantalla: la talla sin distinguir el caso. */
const sizeKey = (s: MasterPlanSizeColumn) => s.size?.trim().toUpperCase() || "Otros";

/**
 * Los tres bloques de la planilla del taller, con las mismas columnas que en
 * pantalla. Un bloque que no aplica sale «No aplica» en el taller y en el
 * estado, y vacío en el resto.
 */
const BLOQUES: Array<{ key: MasterPlanStageKey; title: string; cols: string[] }> = [
  { key: "cut", title: "Corte", cols: ["Taller", "Fch. Prog.", "Fch. Real", "Cant. Real", "% Corte", "Estado"] },
  { key: "sewing", title: "Costura", cols: ["Taller", "Fch. Prog. Inicio", "Fch. Real Fin", "Avance %", "Estado"] },
  { key: "finishing", title: "Acabado", cols: ["Taller", "Fch. Prog. Inicio", "Fch. Prog. Fin", "Avance %", "Estado"] },
];

const celdasBloque = (line: MasterPlanLine, key: MasterPlanStageKey): (string | number | null)[] => {
  const st = line.stages[key];
  const estado = STAGE_STATES[key][st.status].label;
  if (!st.applies) {
    return key === "cut" ? [estado, null, null, null, null, estado] : [estado, null, null, null, estado];
  }
  const taller = stageWorkshop(st, tallerCorto);
  if (key === "cut") return [taller, st.plannedEnd, st.actualEnd, st.advanced, st.percent, estado];
  if (key === "sewing") return [taller, st.plannedStart, st.actualEnd, st.percent, estado];
  return [taller, st.plannedStart, st.plannedEnd, st.percent, estado];
};

/**
 * El Excel del Plan de producción con las columnas del Maestro: una fila por
 * línea con sus tallas y, al pie, los totales. Sin columnas de cliente.
 */
export function generateMasterPlanExcel(data: MasterPlanLinesResponse): void {
  // Las tallas de todo lo exportado (la respuesta trae las de la página),
  // por nombre y ordenadas por el menor id de su término, como en pantalla.
  const porNombre = new Map<string, MasterPlanSizeColumn>();
  for (const line of data.data) {
    for (const s of line.sizes) {
      const actual = porNombre.get(sizeKey(s));
      if (!actual || (s.sizeTermId !== null && (actual.sizeTermId === null || s.sizeTermId < actual.sizeTermId))) {
        porNombre.set(sizeKey(s), { size: s.size, sizeTermId: s.sizeTermId });
      }
    }
  }
  const tallas = [...porNombre.values()].sort(
    (a, b) => (a.sizeTermId ?? Infinity) - (b.sizeTermId ?? Infinity)
  );

  const header = [
    "Fch. Doc.",
    "OP",
    "O/C",
    "Modelo",
    "Color",
    ...tallas.map(sizeKey),
    "Cant. Prog.",
    ...BLOQUES.flatMap((b) => b.cols.map((c) => `${b.title} · ${c}`)),
    "Estado",
    "Entrega",
  ];
  /** Las columnas fijas antes del cuadro de tallas: la fila TOTAL las deja en blanco. */
  const antesDeTallas = 5;
  const rows: (string | number | null)[][] = [header];
  for (const line of data.data) {
    rows.push([
      line.issueDate,
      line.productionOrderCode,
      line.cutCode,
      line.model,
      line.color,
      ...tallas.map((t) => line.sizes.find((s) => sizeKey(s) === sizeKey(t))?.quantity ?? 0),
      line.quantity,
      ...BLOQUES.flatMap((b) => celdasBloque(line, b.key)),
      MASTER_PLAN_STATES[line.state].label,
      line.promisedDate,
    ]);
  }
  rows.push([
    "TOTAL",
    ...Array<string>(antesDeTallas - 1).fill(""),
    ...tallas.map((t) => data.totals.sizes.find((s) => sizeKey(s) === sizeKey(t))?.quantity ?? 0),
    data.totals.quantity,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = header.map((h) => ({ wch: Math.max(8, Math.min(28, h.length + 4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plan de produccion");
  XLSX.writeFile(wb, `plan-de-produccion-${getTodayDate()}.xlsx`);
}
