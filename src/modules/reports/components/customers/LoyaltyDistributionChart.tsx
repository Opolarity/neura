import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
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
import type { LoyaltyDistributionItem, CustomersByLoyaltyItem, LoyaltyLevel } from '../../types/reports.types';

interface Props {
  data: LoyaltyDistributionItem[];
  loading: boolean;
  byLoyalty: CustomersByLoyaltyItem[];
}

const LOYALTY_CLASSES: Record<LoyaltyLevel, string> = {
  sin_nivel: 'border-slate-200 bg-slate-50 text-slate-700',
  L1: 'border-sky-200 bg-sky-50 text-sky-700',
  L2: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  L3: 'border-violet-200 bg-violet-50 text-violet-700',
  L4: 'border-amber-200 bg-amber-50 text-amber-700',
};

const LOYALTY_LABELS: Record<LoyaltyLevel, string> = {
  sin_nivel: 'Sin nivel',
  L1: 'Nivel 1 (150-749)',
  L2: 'Nivel 2 (750-1499)',
  L3: 'Nivel 3 (1500-2999)',
  L4: 'Nivel 4 (3000+)',
};

export function LoyaltyDistributionChart({ data, loading, byLoyalty }: Props) {
  const chartData = data.map((d) => ({
    nivel: LOYALTY_LABELS[d.level] ?? d.level,
    clientes: d.count,
  }));

  return (
    <ReportCard title="Distribución por nivel de fidelización">
      {loading ? (
        <ChartLoading />
      ) : (
        <>
          <ChartContainer
            config={{ clientes: { label: 'Clientes', color: reportChartColors.blue } }}
            className="h-48 w-full aspect-auto"
          >
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} className={chartGrid} />
              <XAxis dataKey="nivel" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
              <Bar dataKey="clientes" fill="var(--color-clientes)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.map((d) => (
              <Badge key={d.level} variant="outline" className={LOYALTY_CLASSES[d.level]}>
                {LOYALTY_LABELS[d.level]}: {d.count}
              </Badge>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
