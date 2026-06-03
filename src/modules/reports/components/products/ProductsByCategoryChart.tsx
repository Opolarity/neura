import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { ProductsByCategoryItem } from '../../types/reports.types';

interface Props {
  data: ProductsByCategoryItem[];
  loading: boolean;
}

export function ProductsByCategoryChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    categoria: d.category_name,
    unidades: d.total_quantity,
  }));

  return (
    <ReportCard title="Ventas por categoría">
      {loading ? (
        <ChartLoading className="h-72" />
      ) : (
        <ChartContainer
          config={{ unidades: { label: 'Unidades', color: reportChartColors.indigo } }}
          className="h-72 w-full aspect-auto"
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="categoria" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${formatNumber(value as number)} uds`} />} />
            <Bar dataKey="unidades" fill="var(--color-unidades)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
