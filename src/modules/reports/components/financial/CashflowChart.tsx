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
import type { CashflowItem, Granularity } from '../../types/reports.types';

interface Props {
  data: CashflowItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

export function CashflowChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    fecha: d.period,
    ingresos: d.income,
    egresos: d.expense,
    neto: d.net,
  }));

  return (
    <ReportCard
      title="Flujo de caja en el tiempo"
      actions={
        <ReportSelect<Granularity>
          value={granularity}
          onValueChange={onGranularityChange}
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
            ingresos: { label: 'Ingresos', color: reportChartColors.emerald },
            egresos: { label: 'Egresos', color: reportChartColors.rose },
          }}
          className="h-56 w-full aspect-auto"
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatCurrencyAxis} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrencyAxis(value as number)} />} />
            <Area dataKey="ingresos" type="monotone" fill="var(--color-ingresos)" fillOpacity={0.16} stroke="var(--color-ingresos)" strokeWidth={2} />
            <Area dataKey="egresos" type="monotone" fill="var(--color-egresos)" fillOpacity={0.12} stroke="var(--color-egresos)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
