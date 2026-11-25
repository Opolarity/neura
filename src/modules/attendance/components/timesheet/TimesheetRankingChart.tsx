import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
  ReportSelect,
} from "@/modules/reports/components/shared/ReportScaffold";
import {
  chartAxis,
  chartGrid,
  formatNumber,
  reportChartColors,
  truncateLabel,
} from "@/modules/reports/components/shared/reportChartUtils";
import { TimesheetEmployee } from "../../types/attendance.types";
import { formatMinutes } from "../../utils/format";
import { RankingMetric, rankingRows } from "../../utils/timesheetStats";

interface Props {
  employees: TimesheetEmployee[];
  loading: boolean;
}

const METRICS: Record<RankingMetric, { label: string; title: string; empty: string }> = {
  late_count: { label: "Tardanzas", title: "Personal con más tardanzas", empty: "Nadie llegó tarde en el periodo" },
  late_minutes: { label: "Minutos tarde", title: "Personal con más minutos de tardanza", empty: "Nadie llegó tarde en el periodo" },
  absences: { label: "Faltas", title: "Personal con más faltas", empty: "Nadie faltó en el periodo" },
  overtime: { label: "Horas extra", title: "Personal con más horas extra", empty: "Nadie hizo horas extra en el periodo" },
};

const ROW_HEIGHT = 36;

/** Ranking del personal por tardanzas (por defecto), minutos tarde, faltas u horas extra. */
export function TimesheetRankingChart({ employees, loading }: Props) {
  const [metric, setMetric] = useState<RankingMetric>("late_count");
  const [limit, setLimit] = useState(10);
  const m = METRICS[metric];
  const enMinutos = metric === "late_minutes" || metric === "overtime";
  const formatValue = (v: number) => (enMinutos ? formatMinutes(v) : formatNumber(v));

  const chartData = rankingRows(employees, metric, limit).map((r) => ({
    ...r,
    persona: truncateLabel(r.name, 26),
  }));
  const chartHeight = Math.max(160, chartData.length * ROW_HEIGHT + 32);

  return (
    <ReportCard
      title={m.title}
      info="Tardanza: minutos después de la hora de entrada del horario de la persona, pasada su tolerancia; cada día que llegó tarde cuenta una vez. Falta: día con horario y sin marcas. Las personas en 0 no aparecen."
      actions={
        <div className="flex flex-wrap gap-2">
          <ReportSelect
            value={metric}
            onValueChange={(v) => setMetric(v as RankingMetric)}
            className="w-36"
            options={(Object.keys(METRICS) as RankingMetric[]).map((k) => ({ value: k, label: METRICS[k].label }))}
          />
          <ReportSelect
            value={String(limit)}
            onValueChange={(v) => setLimit(Number(v))}
            className="w-24"
            options={[
              { value: "5", label: "Top 5" },
              { value: "10", label: "Top 10" },
              { value: "20", label: "Top 20" },
            ]}
          />
        </div>
      }
    >
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>{m.empty}</EmptyReportState>
      ) : (
        <ChartContainer
          config={{ value: { label: m.label, color: reportChartColors.amber } }}
          className="w-full aspect-auto"
          style={{ height: chartHeight }}
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 64 }}>
            <CartesianGrid horizontal={false} className={chartGrid} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="persona"
              tickLine={false}
              axisLine={false}
              width={180}
              interval={0}
              className={chartAxis}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                    return item ? `${item.name} · ${item.code}` : null;
                  }}
                  formatter={(_value, _name, _item, _index, payload) => {
                    const p = payload as unknown as (typeof chartData)[number];
                    return (
                      <div className="flex w-full flex-col gap-1">
                        {[
                          ["Tardanzas", formatNumber(p.lateCount)],
                          ["Minutos tarde", formatMinutes(p.lateMinutes)],
                          ["Faltas", formatNumber(p.absences)],
                          ["Horas trabajadas", formatMinutes(p.workedMinutes)],
                          ["Horas extra", formatMinutes(p.overtimeMinutes)],
                        ].map(([label, value]) => (
                          <div key={label} className="flex flex-1 items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {chartData.map((r) => (
                <Cell key={r.id} fill={metric === "absences" ? reportChartColors.rose : metric === "overtime" ? reportChartColors.blue : reportChartColors.amber} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => formatValue(value)}
                className="fill-muted-foreground text-[11px] tabular-nums"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
