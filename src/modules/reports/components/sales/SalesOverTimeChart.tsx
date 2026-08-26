import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { SalesOverTimeItem, Granularity } from '../../types/reports.types';
import { ChartLoading, ReportCard, ReportSelect } from '../shared/ReportScaffold';
import { chartAxis, chartGrid, formatCurrencyAxis, reportChartColors } from '../shared/reportChartUtils';

interface Props {
  data: SalesOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

const GRANULARITY_OPTIONS: Array<{ value: Granularity; label: string }> = [
  { value: 'day', label: 'Diario' },
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensual' },
];

const CHART_CONFIG = { ventas: { label: 'Ventas', color: reportChartColors.blue } };

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
          options={GRANULARITY_OPTIONS}
          className="w-32"
        />
      }
    >
      {loading ? (
        <ChartLoading className="h-56" />
      ) : (
        <ChartContainer config={CHART_CONFIG} className="h-56 w-full aspect-auto">
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tick={{ className: chartAxis }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCurrencyAxis} width={84} tick={{ className: chartAxis }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrencyAxis(v as number)} />} />
            <Area dataKey="ventas" type="monotone" fill="var(--color-ventas)" fillOpacity={0.18} stroke="var(--color-ventas)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
