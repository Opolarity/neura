import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
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
import type { LowStockDistributionItem } from '../../types/reports.types';

interface Props {
  data: LowStockDistributionItem[];
  loading: boolean;
  threshold: number;
}

export function LowStockDistributionChart({ data, loading, threshold }: Props) {
  const chartData = data.map((d) => ({
    stock: String(d.stock),
    skus: d.skus,
  }));
  const total = data.reduce((acc, d) => acc + d.skus, 0);

  return (
    <ReportCard
      title="Distribución de stock bajo"
      actions={
        <Badge variant="outline" className="border-warning-soft bg-warning-soft text-warning-soft-foreground">
          {formatNumber(total)} SKUs ≤ {threshold} uds
        </Badge>
      }
    >
      {loading ? (
        <ChartLoading />
      ) : total === 0 ? (
        <EmptyReportState>Sin productos con stock bajo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{ skus: { label: 'SKUs', color: reportChartColors.amber } }}
          className="h-56 w-full aspect-auto"
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis
              dataKey="stock"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className={chartAxis}
              label={{ value: 'Unidades en stock', position: 'insideBottom', offset: -4, className: chartAxis }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} className={chartAxis} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Stock: ${label} uds`}
                  formatter={(value) => `${formatNumber(value as number)} SKUs`}
                />
              }
            />
            <Bar dataKey="skus" fill="var(--color-skus)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
