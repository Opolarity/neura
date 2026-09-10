import { Cell, Label, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import { returnTypeColor } from './returnTypeColors';
import type { ReturnsByTypeItem } from '../../types/reports.types';

interface Props {
  data: ReturnsByTypeItem[];
  loading: boolean;
}

/**
 * La dona muestra el TIPO de retorno, no el motivo: el tipo es un catálogo
 * cerrado de tres (Devolución total, Devolución parcial, Cambio), mientras que
 * `returns.reason` es texto libre — 73 valores distintos en 120 retornos — y
 * daba una torta de veintipico de rebanadas ilegible.
 */
export function ReturnsByTypeChart({ data, loading }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d, i) => ({
    name: d.return_type_name,
    value: d.count,
    unidades: d.total_units_returned,
    reembolso: d.total_refund_amount,
    pct: total > 0 ? (d.count / total) * 100 : 0,
    color: returnTypeColor(d.return_type_name, i),
  }));

  return (
    <ReportCard
      info="Cantidad de retornos del período según su tipo: devolución total, devolución parcial o cambio. Se usa el tipo y no el motivo porque el motivo es texto libre y tiene decenas de valores distintos. Al pasar el mouse se ven también las unidades y el monto reembolsado de cada tipo."
      title="Devoluciones por tipo"
    >
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo</EmptyReportState>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <ChartContainer config={{}} className="h-56 w-full aspect-auto sm:w-1/2">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof chartData)[number];
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                      <p className="mb-1 flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </p>
                      <div className="grid gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Retornos</span>
                          <span className="font-mono tabular-nums">
                            {formatNumber(p.value)} ({p.pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Unidades</span>
                          <span className="font-mono tabular-nums">{formatNumber(p.unidades)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Reembolsado</span>
                          <span className="font-mono tabular-nums">{formatCurrencyAxis(p.reembolso)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={86}
                paddingAngle={3}
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={(cy ?? 0) - 6} className="fill-foreground text-2xl font-semibold tabular-nums">
                          {formatNumber(total)}
                        </tspan>
                        <tspan x={cx} y={(cy ?? 0) + 14} className="fill-muted-foreground text-xs">
                          retornos
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Leyenda: un renglón por tipo con cantidad y participación */}
          <ul className="w-full space-y-2 sm:w-1/2">
            {chartData.map((entry) => (
              <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="text-right text-muted-foreground tabular-nums">
                  <span className="font-medium text-foreground">{formatNumber(entry.value)}</span>{' '}
                  ({entry.pct.toFixed(1)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ReportCard>
  );
}
