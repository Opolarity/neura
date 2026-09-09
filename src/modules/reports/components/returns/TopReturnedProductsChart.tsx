import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatNumber,
  reportChartColors,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { TopReturnedProduct } from '../../types/reports.types';

interface Props {
  data: TopReturnedProduct[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

export function TopReturnedProductsChart({ data, loading, limit, onLimitChange }: Props) {
  const chartData = data.map((d) => ({
    producto: truncateLabel(d.product_title, 24),
    devoluciones: d.return_count,
    unidades: d.total_quantity_returned,
  }));

  return (
    <ReportCard
      title="Productos más devueltos"
      description="Solo la mercadería que entra; el reemplazo que sale en un cambio no cuenta."
      actions={
        <ReportSelect
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
          className="w-24"
          options={[
            { value: '5', label: 'Top 5' },
            { value: '10', label: 'Top 10' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin productos devueltos en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{
            devoluciones: { label: 'Devoluciones', color: reportChartColors.blue },
            unidades: { label: 'Unidades', color: reportChartColors.sky },
          }}
          className="h-56 w-full aspect-auto"
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} className={chartGrid} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="producto" tickLine={false} axisLine={false} width={136} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
            <Bar dataKey="devoluciones" fill="var(--color-devoluciones)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
