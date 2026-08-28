import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { NewVsReturningData } from '../../types/reports.types';

interface Props {
  data: NewVsReturningData | null;
  loading: boolean;
}

function formatPeriod(period: string, granularity: 'day' | 'month') {
  const date = new Date(`${period}T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  return granularity === 'month'
    ? date.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })
    : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function NewVsReturningChart({ data, loading }: Props) {
  const granularity = data?.granularity ?? 'month';
  const chartData = (data?.series ?? []).map((d) => ({
    periodo: formatPeriod(d.period, granularity),
    nuevos: d.new_customers,
    recurrentes: d.returning_customers,
  }));

  return (
    <ReportCard title="Clientes nuevos vs recurrentes">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin compras en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{
            nuevos: { label: 'Nuevos', color: reportChartColors.emerald },
            recurrentes: { label: 'Recurrentes', color: reportChartColors.indigo },
          }}
          className="h-64 w-full aspect-auto"
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="periodo" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              allowDecimals={false}
              className={chartAxis}
            />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
            <Area
              dataKey="recurrentes"
              stackId="clientes"
              type="monotone"
              fill="var(--color-recurrentes)"
              fillOpacity={0.18}
              stroke="var(--color-recurrentes)"
              strokeWidth={2}
            />
            <Area
              dataKey="nuevos"
              stackId="clientes"
              type="monotone"
              fill="var(--color-nuevos)"
              fillOpacity={0.28}
              stroke="var(--color-nuevos)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
