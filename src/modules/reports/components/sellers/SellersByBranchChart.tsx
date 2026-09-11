import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  chartQualitativeSeries,
  formatCurrencyAxis,
  formatCurrencyTick,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { SellersByBranchItem } from '../../types/reports.types';

interface Props {
  data: SellersByBranchItem[];
  loading: boolean;
}

// Más de 6 vendedores apilados no se leen: el resto va en "Otros".
const MAX_SERIES = 6;
const OTHERS = 'Otros vendedores';
const NO_SELLER = 'Sin vendedor';

/** Ventas por sucursal del pedido, apiladas por vendedor. */
export function SellersByBranchChart({ data, loading }: Props) {
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

    const byBranch = new Map<string, Record<string, number>>();
    for (const d of data) {
      const key = d.seller_name === NO_SELLER ? NO_SELLER : top.includes(d.seller_name) ? d.seller_name : OTHERS;
      let row = byBranch.get(d.branch_name);
      if (!row) {
        row = {};
        byBranch.set(d.branch_name, row);
      }
      row[key] = (row[key] ?? 0) + d.revenue;
    }
    // "Sin vendedor" siempre al final y en gris, para que se distinga de las personas.
    const s = [...top, ...(hasOthers ? [OTHERS] : []), ...(hasNoSeller ? [NO_SELLER] : [])];
    const rows = [...byBranch.entries()]
      .map(([branch, values]) => ({
        sucursal: branch,
        total: Object.values(values).reduce((a, b) => a + b, 0),
        ...values,
      }))
      .sort((a, b) => b.total - a.total);
    return { chartData: rows, series: s };
  }, [data]);

  const colorOf = (name: string, i: number) =>
    name === NO_SELLER ? 'hsl(var(--muted-foreground))' : chartQualitativeSeries[i % chartQualitativeSeries.length];
  const config = Object.fromEntries(
    series.map((name, i) => [name, { label: truncateLabel(name, 22), color: colorOf(name, i) }]),
  );

  return (
    <ReportCard
      info="Ventas del período por sucursal en la que se registró el pedido, apiladas por vendedor. Se muestran los 6 vendedores con más ventas; el resto va en Otros vendedores. Sin vendedor son las ventas de web y chatbot, que quedan asignadas a la sucursal del pedido pero no a una persona. Ventas es el valor del pedido."
      title="Vendedores por sucursal"
      className="flex flex-col"
      contentClassName="flex-1 min-h-0"
    >
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo</EmptyReportState>
      ) : (
        <ChartContainer config={config} className="h-full min-h-64 w-full aspect-auto">
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="sucursal" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
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
              <Bar
                key={name}
                dataKey={name}
                stackId="ventas"
                fill={colorOf(name, i)}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={72}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
