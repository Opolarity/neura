import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { CustomersByBranchItem } from '../../types/reports.types';

interface Props {
  data: CustomersByBranchItem[];
  loading: boolean;
}

/**
 * Compradores únicos por sucursal del pedido, en barras. Va al lado del
 * treemap por canal; un cliente que compró en dos sedes cuenta en las dos,
 * así que la suma de las barras puede superar "Compradores únicos".
 */
export function CustomersByBranchChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    sucursal: d.branch_name,
    compradores: d.unique_buyers,
    pedidos: d.order_count,
    ingresos: d.revenue,
  }));

  return (
    <ReportCard
      info="Compradores únicos del período según la sucursal en la que se registró el pedido. Un cliente que compró en dos sedes cuenta en las dos, así que la suma de las barras puede superar la tarjeta Compradores únicos. Al pasar el mouse se ven también los pedidos y los ingresos de cada sede. Excluye pedidos cancelados y reembolsados."
      title="Clientes por sucursal"
      className="flex flex-col"
      contentClassName="flex-1 min-h-0"
    >
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{ compradores: { label: 'Compradores únicos', color: reportChartColors.indigo } }}
          className="h-full min-h-56 w-full aspect-auto"
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12, top: 16 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="sucursal" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} className={chartAxis} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, _item, _index, payload) => {
                    const p = payload as unknown as (typeof chartData)[number];
                    return (
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex flex-1 items-center justify-between leading-none">
                          <span className="text-muted-foreground">Compradores</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatNumber(value as number)}
                          </span>
                        </div>
                        <div className="flex flex-1 items-center justify-between leading-none">
                          <span className="text-muted-foreground">Pedidos</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatNumber(p.pedidos)}
                          </span>
                        </div>
                        <div className="flex flex-1 items-center justify-between leading-none">
                          <span className="text-muted-foreground">Ingresos</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatCurrencyAxis(p.ingresos)}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="compradores" fill="var(--color-compradores)" radius={[4, 4, 0, 0]} maxBarSize={64}>
              <LabelList
                dataKey="compradores"
                position="top"
                formatter={(value: number) => formatNumber(value)}
                className="fill-muted-foreground text-[11px] tabular-nums"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
