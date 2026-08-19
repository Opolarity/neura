import { Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import { chartQualitativeSeries, formatNumber } from '../shared/reportChartUtils';
import type { StockByCategoryItem } from '../../types/reports.types';

interface Props {
  data: StockByCategoryItem[];
  loading: boolean;
}

export function StockByCategoryChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({ name: d.category, value: d.units, skus: d.skus }));
  const totalUnits = chartData.reduce((acc, d) => acc + d.value, 0);
  const colors = chartQualitativeSeries;

  return (
    <ReportCard title="Stock por categoría">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin stock registrado</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{ value: { label: 'Unidades', color: 'hsl(var(--primary))' } }}
            className="h-52 w-full aspect-auto"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => {
                      const units = Number(value);
                      const pct = totalUnits > 0 ? ((100 * units) / totalUnits).toFixed(1) : '0';
                      return `${item?.payload?.name}: ${formatNumber(units)} uds (${pct}%)`;
                    }}
                  />
                }
              />
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
                {entry.name}: {formatNumber(entry.value)}
              </span>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
