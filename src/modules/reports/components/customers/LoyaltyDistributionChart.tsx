import { Cell, Label, Pie, PieChart } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartBadgeStyle,
  formatCurrencyAxis,
  formatNumber,
  loyaltyBadgeColors,
} from '../shared/reportChartUtils';
import type { LoyaltyDistributionItem, CustomersByLoyaltyItem, LoyaltyLevel } from '../../types/reports.types';

interface Props {
  data: LoyaltyDistributionItem[];
  loading: boolean;
  byLoyalty: CustomersByLoyaltyItem[];
}

const LOYALTY_LABELS: Record<LoyaltyLevel, string> = {
  sin_nivel: 'Sin nivel',
  L1: 'Nivel 1 (150-749)',
  L2: 'Nivel 2 (750-1499)',
  L3: 'Nivel 3 (1500-2999)',
  L4: 'Nivel 4 (3000+)',
};

export function LoyaltyDistributionChart({ data, loading, byLoyalty }: Props) {
  const chartData = data.map((d) => ({
    name: LOYALTY_LABELS[d.level] ?? d.level,
    level: d.level,
    value: d.count,
  }));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const avgSpentByLevel = new Map(byLoyalty.map((b) => [b.level, b.avg_spent]));

  return (
    <ReportCard title="Distribución por nivel de fidelización">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin clientes con perfil de fidelización</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{ value: { label: 'Clientes' } }}
            className="h-52 w-full aspect-auto"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => formatNumber(value as number)} />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={2}>
                {chartData.map((entry) => (
                  <Cell key={entry.level} fill={loyaltyBadgeColors[entry.level]} />
                ))}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                          {formatNumber(total)}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                          clientes
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-3 space-y-1.5">
            {data.map((d) => {
              const avgSpent = avgSpentByLevel.get(d.level);
              return (
                <div key={d.level} className="flex items-center justify-between gap-3 text-sm">
                  <Badge variant="outline" style={chartBadgeStyle(loyaltyBadgeColors[d.level])}>
                    {LOYALTY_LABELS[d.level]}
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatNumber(d.count)} ({total > 0 ? ((d.count / total) * 100).toFixed(1) : '0'}%)
                    {avgSpent != null && (
                      <span className="ml-2">· gasto prom. {formatCurrencyAxis(avgSpent)}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </ReportCard>
  );
}
