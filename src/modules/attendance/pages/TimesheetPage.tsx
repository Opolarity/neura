import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReportsFilters } from "@/modules/reports/context/ReportsFiltersContext";
import { ReportsFilterBar } from "@/modules/reports/components/shared/ReportsFilterBar";
import { ReportGuideSheet } from "@/modules/reports/components/shared/ReportGuideSheet";
import { TabSkeleton } from "@/modules/reports/components/shared/TabSkeleton";
import { timesheetGuide } from "@/modules/reports/guides/reportGuides";
import { useAttendanceTimesheet } from "../hooks/useAttendanceTimesheet";
import { EmployeeKind, KIND_LABELS, PAY_TYPE_LABELS, PayType, TimesheetEmployee } from "../types/attendance.types";
import { generateTimesheetExcel } from "../utils/generateTimesheetExcel";
import {
  EMPTY_TIMESHEET_FILTERS,
  TimesheetExtraFilters,
  TimesheetSituation,
  filterTimesheet,
} from "../utils/timesheetStats";

const TimesheetDashboard = lazy(() =>
  import("../components/timesheet/TimesheetDashboard").then((m) => ({ default: m.TimesheetDashboard })),
);

const ALL = "all";

const SITUATION_LABELS: Record<TimesheetSituation, string> = {
  ABSENT: "Con faltas",
  INCOMPLETE: "Con días incompletos",
  LATE: "Con tardanzas",
};

/** «Más filtros» del cuadre: la búsqueda va al servidor; tipo, pago y situación se filtran aquí. */
interface Extra extends TimesheetExtraFilters {
  search: string;
}

const EMPTY_EXTRA: Extra = { search: "", ...EMPTY_TIMESHEET_FILTERS };

const sameExtra = (a: Extra, b: Extra) =>
  a.search.trim() === b.search.trim() && a.kind === b.kind && a.payType === b.payType && a.situation === b.situation;

/**
 * Reportes › Cuadre de horas (attendance_timesheet.list): la misma barra de
 * filtros que el resto de Reportes (el rango lo comparte con ellos) y los KPIs
 * y gráficas de asistencia y pago. Trabajador, tipo, pago y situación van en
 * «Más filtros». El detalle por trabajador (pagos y bolsa de horas) vive en
 * Asistencia › Pagos.
 */
const TimesheetPage = () => {
  const { filters, applyVersion, applyImmediate, draft } = useReportsFilters();
  const [extraDraft, setExtraDraft] = useState<Extra>(EMPTY_EXTRA);
  const [extra, setExtra] = useState<Extra>(EMPTY_EXTRA);

  // «Aplicar» de la barra aplica también lo de «Más filtros».
  useEffect(() => {
    setExtra(extraDraft);
    // Solo al aplicar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion]);

  const t = useAttendanceTimesheet(filters.startDate, filters.endDate, extra.search);
  const employees = useMemo(() => filterTimesheet(t.data?.employees ?? [], extra), [t.data, extra]);

  const extraActiveCount = [extraDraft.search.trim() || null, extraDraft.kind, extraDraft.payType, extraDraft.situation].filter(
    (v) => v !== null,
  ).length;

  const exportar = (list: TimesheetEmployee[]) => t.data && generateTimesheetExcel({ ...t.data, employees: list });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Cuadre de horas</h1>
        <ReportGuideSheet guide={timesheetGuide} />
      </div>

      <ReportsFilterBar
        extraActiveCount={extraActiveCount}
        extraDirty={!sameExtra(extraDraft, extra)}
        onClearExtra={() => {
          setExtraDraft(EMPTY_EXTRA);
          setExtra(EMPTY_EXTRA);
          applyImmediate(draft);
        }}
        exportSlot={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={employees.length === 0}
            onClick={() => exportar(employees)}
          >
            <Download className="w-3.5 h-3.5" />
            Descargar
          </Button>
        }
        extraFields={
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="timesheet-search">Trabajador</Label>
              <Input
                id="timesheet-search"
                placeholder="Nombre o código"
                value={extraDraft.search}
                onChange={(e) => setExtraDraft((p) => ({ ...p, search: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={extraDraft.kind ?? ALL}
                onValueChange={(v) => setExtraDraft((p) => ({ ...p, kind: v === ALL ? null : (v as EmployeeKind) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {(Object.keys(KIND_LABELS) as EmployeeKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Pago</Label>
              <Select
                value={extraDraft.payType ?? ALL}
                onValueChange={(v) => setExtraDraft((p) => ({ ...p, payType: v === ALL ? null : (v as PayType) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {(["HOURLY", "PIECE", "SALARY"] as PayType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {PAY_TYPE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Situación</Label>
              <Select
                value={extraDraft.situation ?? ALL}
                onValueChange={(v) =>
                  setExtraDraft((p) => ({ ...p, situation: v === ALL ? null : (v as TimesheetSituation) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {(Object.keys(SITUATION_LABELS) as TimesheetSituation[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {SITUATION_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <Suspense fallback={<TabSkeleton />}>
        <TimesheetDashboard employees={employees} loading={t.loading} />
      </Suspense>
    </div>
  );
};

export default TimesheetPage;
