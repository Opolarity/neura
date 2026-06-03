import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { SalesOverTimeItem, Granularity } from '../../types/reports.types';

interface Props {
  data: SalesOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  day: 'Diario',
  week: 'Semanal',
  month: 'Mensual',
};

export function SalesOverTimeChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    fecha: d.period,
    ventas: d.total_revenue,
    pedidos: d.order_count,
  }));

  return (
    <ReportCard
      title="Ventas en el tiempo"
      actions={
        <ReportSelect
          value={granularity}
          onValueChange={onGranularityChange}
          options={(Object.entries(GRANULARITY_LABELS) as [Granularity, string][]).map(([value, label]) => ({
            value,
            label,
          }))}
          className="w-32"
        />
      }
    >
      {loading ? (
        <ChartLoading />
      ) : (
        <ChartContainer
          config={{ ventas: { label: 'Ventas', color: reportChartColors.blue } }}
          className="h-56 w-full aspect-auto"
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={84}
              tickFormatter={formatCurrencyAxis}
              className={chartAxis}
            />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrencyAxis(value as number)} />} />
            <Area
              dataKey="ventas"
              type="monotone"
              fill="var(--color-ventas)"
              fillOpacity={0.18}
              stroke="var(--color-ventas)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
