import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { FinancialByClassItem } from '../../types/reports.types';

interface Props {
  data: FinancialByClassItem[];
  loading: boolean;
}

export function FinancialByClassChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    clase: d.class_name,
    ingresos: d.income,
    egresos: d.expense,
  }));

  return (
    <ReportCard title="Por clase de movimiento">
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
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="clase" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatCurrencyAxis} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrencyAxis(value as number)} />} />
            <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="egresos" fill="var(--color-egresos)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
