import { Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  formatCurrencyAxis,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { FinancialByPaymentItem } from '../../types/reports.types';

interface Props {
  data: FinancialByPaymentItem[];
  loading: boolean;
}

export function FinancialByPaymentChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    name: d.payment_method_name,
    value: d.income,
  }));
  const colors = [
    reportChartColors.emerald,
    reportChartColors.teal,
    reportChartColors.cyan,
    reportChartColors.sky,
    reportChartColors.indigo,
    reportChartColors.violet,
  ];

  return (
    <ReportCard title="Ingresos por método de pago">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{ value: { label: 'Ingresos', color: reportChartColors.emerald } }}
            className="h-52 w-full aspect-auto"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => formatCurrencyAxis(value as number)} />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap gap-2">
            {chartData.map((entry, index) => (
              <span key={entry.name} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                {entry.name}
              </span>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
