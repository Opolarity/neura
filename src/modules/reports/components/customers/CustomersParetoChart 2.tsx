import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { CustomersParetoItem } from '../../types/reports.types';

interface Props {
  data: CustomersParetoItem[];
  loading: boolean;
}

export function CustomersParetoChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    decil: `Top ${d.decile * 10}%`,
    ingresos: d.revenue,
    clientes: d.customer_count,
    pctIndividual: d.revenue_pct,
    acumulado: d.cumulative_pct,
  }));

  const topDecile = data.find((d) => d.decile === 1);

  return (
    <ReportCard title="Concentración de ingresos (Pareto)">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin compras en el periodo</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{
              ingresos: { label: 'Ingresos', color: reportChartColors.violet },
              acumulado: { label: '% acumulado', color: reportChartColors.amber },
            }}
            className="h-56 w-full aspect-auto"
          >
            <ComposedChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} className={chartGrid} />
              <XAxis dataKey="decil" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
              <YAxis
                yAxisId="ingresos"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={72}
                tickFormatter={formatCurrencyAxis}
                className={chartAxis}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                tickFormatter={(v) => `${v}%`}
                className={chartAxis}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, _item, index, payload) => {
                      if (name === 'acumulado') {
                        return (
                          <div className="flex w-full items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">% acumulado</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {(value as number).toFixed(1)}%
                            </span>
                          </div>
                        );
                      }
                      const row = payload as unknown as { clientes: number; pctIndividual: number };
                      return (
                        <div className="flex w-full flex-col gap-1" key={index}>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Ingresos</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatCurrencyAxis(value as number)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">% del total</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {row.pctIndividual.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Clientes</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatNumber(row.clientes)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <ReferenceLine
                yAxisId="pct"
                y={80}
                stroke={reportChartColors.slate}
                strokeDasharray="4 4"
              />
              <Bar dataKey="ingresos" yAxisId="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
              <Line
                dataKey="acumulado"
                yAxisId="pct"
                type="monotone"
                stroke="var(--color-acumulado)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--color-acumulado)', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ChartContainer>
          {topDecile && (
            <p className="mt-3 text-xs text-muted-foreground">
              El 10% de clientes que más gasta ({formatNumber(topDecile.customer_count)} clientes) concentra el{' '}
              {topDecile.revenue_pct.toFixed(1)}% de los ingresos del periodo.
            </p>
          )}
        </>
      )}
    </ReportCard>
  );
}
