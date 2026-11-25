import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartLoading, EmptyReportState, ReportCard } from "@/modules/reports/components/shared/ReportScaffold";
import { chartAxis, chartGrid } from "@/modules/reports/components/shared/reportChartUtils";
import { formatDateDisplay } from "@/shared/utils/date";
import { TimesheetEmployee } from "../../types/attendance.types";
import { attendanceByDay } from "../../utils/timesheetStats";

interface Props {
  employees: TimesheetEmployee[];
  loading: boolean;
}

const config = {
  onTime: { label: "A tiempo", color: "hsl(var(--success))" },
  late: { label: "Tarde", color: "hsl(var(--warning))" },
  absent: { label: "Faltó", color: "hsl(var(--destructive))" },
};

/** Por día: cuántas personas con horario llegaron a tiempo, tarde o faltaron. */
export function TimesheetDailyChart({ employees, loading }: Props) {
  // "YYYY-MM-DD" → "18/11" sin pasar por Date (es una fecha de calendario).
  const chartData = attendanceByDay(employees).map((d) => ({
    ...d,
    fecha: `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`,
  }));

  return (
    <ReportCard
      title="Asistencia por día"
      info="Personas con horario ese día: a tiempo (marcó sin tardanza), tarde (llegó después de la hora de entrada pasada su tolerancia) o faltó (sin marcas). Los días sin horario no cuentan."
    >
      {loading ? (
        <ChartLoading className="h-64" />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin días con horario en el periodo</EmptyReportState>
      ) : (
        <ChartContainer config={config} className="h-64 w-full aspect-auto">
          <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} className={chartAxis} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} className={chartAxis} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                    return item ? formatDateDisplay(item.day) : null;
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="onTime" stackId="dia" fill="var(--color-onTime)" maxBarSize={28} />
            <Bar dataKey="late" stackId="dia" fill="var(--color-late)" maxBarSize={28} />
            <Bar dataKey="absent" stackId="dia" fill="var(--color-absent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
