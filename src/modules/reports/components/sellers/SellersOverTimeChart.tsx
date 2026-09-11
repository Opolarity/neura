import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
  formatCurrencyTick,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { Granularity, SellersOverTimeItem } from '../../types/reports.types';

interface Props {
  data: SellersOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

const MAX_SERIES = 6;
const OTHERS = 'Otros vendedores';
const NO_SELLER = 'Sin vendedor';

/** Ventas por período apiladas por vendedor. Mismo recorte que "por sucursal". */
export function SellersOverTimeChart({ data, loading, granularity, onGranularityChange }: Props) {
  const { chartData, series } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of data) totals.set(d.seller_name, (totals.get(d.seller_name) ?? 0) + d.revenue);
    const top = [...totals.entries()]
      .filter(([name]) => name !== NO_SELLER)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SERIES)
      .map(([name]) => name);
    const hasOthers = [...totals.keys()].some((n) => n !== NO_SELLER && !top.includes(n));
    const hasNoSeller = totals.has(NO_SELLER);

    const byPeriod = new Map<string, Record<string, number>>();
    for (const d of data) {
      const key = d.seller_name === NO_SELLER ? NO_SELLER : top.includes(d.seller_name) ? d.seller_name : OTHERS;
      let row = byPeriod.get(d.period);
      if (!row) {
        row = {};
        byPeriod.set(d.period, row);
      }
      row[key] = (row[key] ?? 0) + d.revenue;
    }
    const s = [...top, ...(hasOthers ? [OTHERS] : []), ...(hasNoSeller ? [NO_SELLER] : [])];
    const rows = [...byPeriod.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, values]) => ({ fecha: period, ...values }));
    return { chartData: rows, series: s };
  }, [data]);

  const colorOf = (name: string, i: number) =>
    name === NO_SELLER ? 'hsl(var(--muted-foreground))' : chartQualitativeSeries[i % chartQualitativeSeries.length];
  const config = Object.fromEntries(
    series.map((name, i) => [name, { label: truncateLabel(name, 22), color: colorOf(name, i) }]),
  );

  return (
    <ReportCard
      info="Ventas de cada período apiladas por vendedor, para ver quién sostiene la venta a lo largo del rango. Los 6 vendedores con más ventas tienen su franja; el resto va en Otros vendedores y las ventas de web y chatbot en Sin vendedor. Ventas es el valor del pedido, fechado por la fecha del pedido."
      title="Ventas por vendedor en el tiempo"
      actions={
        <ReportSelect
          value={granularity}
          onValueChange={onGranularityChange}
          className="w-32"
          options={[
            { value: 'day', label: 'Diario' },
            { value: 'week', label: 'Semanal' },
            { value: 'month', label: 'Mensual' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo</EmptyReportState>
      ) : (
        <ChartContainer config={config} className="h-64 w-full aspect-auto">
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <defs>
              {series.map((name, i) => (
                <linearGradient key={name} id={`fill-seller-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorOf(name, i)} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={colorOf(name, i)} stopOpacity={0.08} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={72} tickFormatter={formatCurrencyTick} className={chartAxis} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">{String(name)}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatCurrencyAxis(value as number)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {series.map((name, i) => (
              <Area
                key={name}
                dataKey={name}
                stackId="ventas"
                type="monotone"
                fill={`url(#fill-seller-${i})`}
                stroke={colorOf(name, i)}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
