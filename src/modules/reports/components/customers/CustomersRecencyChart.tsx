import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartBadgeStyle,
  chartGrid,
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { CustomersRecencyItem, RecencyBucket } from '../../types/reports.types';

interface Props {
  data: CustomersRecencyItem[];
  loading: boolean;
}

const BUCKET_LABELS: Record<RecencyBucket, string> = {
  active: 'Activos (<30 días)',
  at_risk: 'En riesgo (30-90)',
  inactive: 'Inactivos (90-180)',
  dormant: 'Dormidos (+180)',
};

// La recencia es un semáforo, no un ranking: verde → rojo en vez de la serie
// cualitativa. En hex de reportChartColors (no tokens hsl) porque
// chartBadgeStyle deriva el alpha concatenando sobre el hex.
const BUCKET_COLORS: Record<RecencyBucket, string> = {
  active: reportChartColors.emerald,
  at_risk: reportChartColors.amber,
  inactive: reportChartColors.slate,
  dormant: reportChartColors.rose,
};

export function CustomersRecencyChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    bucket: d.bucket,
    label: BUCKET_LABELS[d.bucket] ?? d.bucket,
    clientes: d.customer_count,
    revenue: d.total_revenue,
  }));

  return (
    <ReportCard title="Recencia de clientes">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin historial de compras</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{ clientes: { label: 'Clientes' } }}
            className="h-56 w-full aspect-auto"
          >
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} className={chartGrid} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={136} className={chartAxis} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, _item, index, payload) => {
                      const row = payload as unknown as { revenue: number };
                      return (
                        <div className="flex w-full flex-col gap-1" key={index}>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Clientes</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatNumber(value as number)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Gasto histórico</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatCurrencyAxis(row.revenue)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="clientes" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap gap-2">
            {chartData.map((d) => (
              <Badge key={d.bucket} variant="outline" style={chartBadgeStyle(BUCKET_COLORS[d.bucket])}>
                {d.label}: {formatNumber(d.clientes)}
              </Badge>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
