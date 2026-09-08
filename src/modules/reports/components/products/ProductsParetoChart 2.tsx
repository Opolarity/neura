import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartBadgeStyle,
  chartGrid,
  formatCurrencyAxis,
  reportChartColors,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { ProductsParetoItem, ParetoLimit } from '../../types/reports.types';

interface Props {
  data: ProductsParetoItem[];
  loading: boolean;
  limit: ParetoLimit;
  onLimitChange: (l: ParetoLimit) => void;
}

// La clase A concentra el 80% del ingreso: color dominante; B y C se apagan
// progresivamente para que la lectura sea "cuántas barras sostienen la venta".
const ABC_COLORS: Record<ProductsParetoItem['abc_class'], string> = {
  A: reportChartColors.blue,
  B: reportChartColors.sky,
  C: reportChartColors.slate,
};

const ABC_LABELS: Record<ProductsParetoItem['abc_class'], string> = {
  A: 'Clase A (hasta 80%)',
  B: 'Clase B (80–95%)',
  C: 'Clase C (resto)',
};

export function ProductsParetoChart({ data, loading, limit, onLimitChange }: Props) {
  const chartData = data.map((d) => ({
    producto: truncateLabel(d.product_title, 14),
    tituloCompleto: d.product_title,
    ingresos: d.total_revenue,
    unidades: d.total_quantity,
    pctIndividual: d.revenue_pct,
    acumulado: d.cumulative_pct,
    clase: d.abc_class,
  }));

  const presentClasses = (['A', 'B', 'C'] as const).filter((c) =>
    data.some((d) => d.abc_class === c),
  );

  return (
    <ReportCard
      title="Pareto de productos (ABC)"
      actions={
        <ReportSelect
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value) as ParetoLimit)}
          className="w-24"
          options={[
            { value: '10', label: 'Top 10' },
            { value: '20', label: 'Top 20' },
            { value: '30', label: 'Top 30' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading className="h-80" />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo seleccionado</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{
              ingresos: { label: 'Ingresos', color: reportChartColors.blue },
              acumulado: { label: '% acumulado', color: reportChartColors.amber },
            }}
            className="h-80 w-full aspect-auto"
          >
            <ComposedChart data={chartData} margin={{ left: 12, right: 12, bottom: 8 }}>
              <CartesianGrid vertical={false} className={chartGrid} />
              <XAxis
                dataKey="producto"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-35}
                textAnchor="end"
                height={64}
                interval={0}
                className={chartAxis}
              />
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
                    labelFormatter={(_label, payload) =>
                      (payload?.[0]?.payload as { tituloCompleto?: string })?.tituloCompleto ?? _label
                    }
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
                      const row = payload as unknown as {
                        unidades: number;
                        pctIndividual: number;
                        clase: 'A' | 'B' | 'C';
                      };
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
                            <span className="text-muted-foreground">Unidades</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {row.unidades.toLocaleString('es-PE')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Clase</span>
                            <span className="font-medium text-foreground">{row.clase}</span>
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
              <Bar dataKey="ingresos" yAxisId="ingresos" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.producto} fill={ABC_COLORS[entry.clase]} />
                ))}
              </Bar>
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {presentClasses.map((c) => (
              <Badge key={c} variant="outline" style={chartBadgeStyle(ABC_COLORS[c])}>
                {ABC_LABELS[c]}
              </Badge>
            ))}
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: reportChartColors.amber }}
              />
              % acumulado del ingreso
            </span>
          </div>
        </>
      )}
    </ReportCard>
  );
}
