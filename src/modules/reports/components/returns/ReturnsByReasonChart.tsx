import { Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { ReturnsByReasonItem } from '../../types/reports.types';

interface Props {
  data: ReturnsByReasonItem[];
  loading: boolean;
}

export function ReturnsByReasonChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    name: d.reason,
    value: d.count,
  }));
  const colors = [
    reportChartColors.rose,
    reportChartColors.orange,
    reportChartColors.amber,
    reportChartColors.pink,
    reportChartColors.fuchsia,
    reportChartColors.slate,
  ];

  return (
    <ReportCard title="Devoluciones por motivo">
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{ value: { label: 'Devoluciones', color: reportChartColors.rose } }}
          className="h-56 w-full aspect-auto"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `${formatNumber(value as number)} dev.`} />} />
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
