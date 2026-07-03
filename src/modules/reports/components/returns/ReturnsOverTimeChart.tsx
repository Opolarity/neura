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
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { ReturnsOverTimeItem, Granularity } from '../../types/reports.types';

interface Props {
  data: ReturnsOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

export function ReturnsOverTimeChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    fecha: d.period,
    devoluciones: d.return_count,
    reembolso: d.total_refund_amount,
  }));

  return (
    <ReportCard
      title="Devoluciones en el tiempo"
      actions={
        <ReportSelect
          value={granularity}
          onValueChange={(value) => onGranularityChange(value as Granularity)}
          className="w-32"
          options={[
            { value: 'day', label: 'Diario' },
            { value: 'week', label: 'Semanal' },
            { value: 'month', label: 'Mensual' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading />
      ) : (
        <ChartContainer
          config={{
            devoluciones: { label: 'Devoluciones', color: reportChartColors.blue },
            reembolso: { label: 'Reembolso', color: reportChartColors.sky },
          }}
          className="h-56 w-full aspect-auto"
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => name === 'reembolso' ? formatCurrencyAxis(value as number) : formatNumber(value as number)}
                />
              }
            />
            <Area dataKey="devoluciones" type="monotone" fill="var(--color-devoluciones)" fillOpacity={0.16} stroke="var(--color-devoluciones)" strokeWidth={2} />
            <Area dataKey="reembolso" type="monotone" fill="var(--color-reembolso)" fillOpacity={0.12} stroke="var(--color-reembolso)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
