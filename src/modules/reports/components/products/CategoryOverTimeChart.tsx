import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
  chartQualitativeSeries,
  formatCurrencyAxis,
} from '../shared/reportChartUtils';
import type { CategoryOverTimeItem, Granularity } from '../../types/reports.types';
import { MultiCategoryNotice } from './MultiCategoryNotice';

interface Props {
  data: CategoryOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  day: 'Diario',
  week: 'Semanal',
  month: 'Mensual',
};

// Más allá de 6 categorías el apilado se vuelve ilegible: el resto se agrupa
// en "Otras" para que cada franja conserve un color estable y distinguible.
const MAX_SERIES = 6;
const OTHERS = 'Otras';

export function CategoryOverTimeChart({ data, loading, granularity, onGranularityChange }: Props) {
  const { chartData, categories } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of data) {
      totals.set(d.category_name, (totals.get(d.category_name) ?? 0) + d.total_revenue);
    }
    const topCategories = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SERIES)
      .map(([name]) => name);
    const hasOthers = totals.size > topCategories.length;

    const byPeriod = new Map<string, Record<string, number>>();
    for (const d of data) {
      const key = topCategories.includes(d.category_name) ? d.category_name : OTHERS;
      let row = byPeriod.get(d.period);
      if (!row) {
        row = {};
        byPeriod.set(d.period, row);
      }
      row[key] = (row[key] ?? 0) + d.total_revenue;
    }

    const series = hasOthers ? [...topCategories, OTHERS] : topCategories;
    const rows = [...byPeriod.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, values]) => ({ fecha: period, ...values }));
    return { chartData: rows, categories: series };
  }, [data]);

  const config = Object.fromEntries(
    categories.map((c, i) => [c, { label: c, color: chartQualitativeSeries[i % chartQualitativeSeries.length] }]),
  );

  return (
    <ReportCard
      title="Ingresos por categoría en el tiempo"
      description={<MultiCategoryNotice />}
      actions={
        <ReportSelect
          value={granularity}
          onValueChange={onGranularityChange}
          options={(Object.entries(GRANULARITY_LABELS) as [Granularity, string][]).map(
            ([value, label]) => ({ value, label }),
          )}
          className="w-32"
        />
      }
    >
      {loading ? (
        <ChartLoading className="h-80" />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo seleccionado</EmptyReportState>
      ) : (
        <>
          <ChartContainer config={config} className="h-72 w-full aspect-auto">
            <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
              <defs>
                {categories.map((c, i) => (
                  <linearGradient key={c} id={`fill-cat-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartQualitativeSeries[i % chartQualitativeSeries.length]}
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartQualitativeSeries[i % chartQualitativeSeries.length]}
                      stopOpacity={0.08}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} className={chartGrid} />
              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className={chartAxis}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={84}
                tickFormatter={formatCurrencyAxis}
                className={chartAxis}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4 leading-none">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatCurrencyAxis(value as number)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              {categories.map((c, i) => (
                <Area
                  key={c}
                  dataKey={c}
                  stackId="cats"
                  type="monotone"
                  fill={`url(#fill-cat-${i})`}
                  stroke={chartQualitativeSeries[i % chartQualitativeSeries.length]}
                  strokeWidth={1.5}
                />
              ))}
            </AreaChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: chartQualitativeSeries[i % chartQualitativeSeries.length] }}
                />
                {c}
              </span>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
