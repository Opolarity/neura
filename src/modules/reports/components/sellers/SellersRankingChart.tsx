import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts';
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
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { SellerSummaryItem, SellersMetric, TopLimit } from '../../types/reports.types';

interface Props {
  data: SellerSummaryItem[];
  loading: boolean;
  limit: TopLimit;
  onLimitChange: (l: TopLimit) => void;
  metric: SellersMetric;
  onMetricChange: (m: SellersMetric) => void;
}

const METRIC_LABELS: Record<SellersMetric, string> = {
  revenue: 'Ventas',
  orders: 'Pedidos',
};

// Podio con colores propios; del 4.º en adelante el azul base.
const PODIUM_COLORS = [reportChartColors.violet, reportChartColors.indigo, reportChartColors.sky];
const ROW_HEIGHT = 36;

export function SellersRankingChart({ data, loading, limit, onLimitChange, metric, onMetricChange }: Props) {
  // "Sin vendedor" no compite en el ranking: es web y chatbot, no una persona.
  const sellers = data.filter((d) => d.seller_id !== null);
  const sorted = [...sellers]
    .sort((a, b) => (metric === 'orders' ? b.orders - a.orders : b.revenue - a.revenue))
    .slice(0, limit);

  const chartData = sorted.map((d) => ({
    key: d.seller_id ?? d.seller_name,
    vendedor: truncateLabel(d.seller_name, 28),
    nombreCompleto: d.seller_name,
    sucursal: d.branch_name,
    valor: metric === 'orders' ? d.orders : d.revenue,
    ventas: d.revenue,
    pedidos: d.orders,
    unidades: d.units,
  }));

  const formatValue = metric === 'orders' ? formatNumber : formatCurrencyAxis;
  // Alto según filas para que Recharts no oculte etiquetas del eje.
  const chartHeight = Math.max(160, chartData.length * ROW_HEIGHT + 32);

  return (
    <ReportCard
      info="Ranking de vendedores por ventas o por pedidos. Vendedor es el usuario que registró el pedido en el ERP o el POS; las ventas de web y chatbot no tienen vendedor y no entran acá. Ventas es el valor del pedido, no lo cobrado. Al pasar el mouse se ven ventas, pedidos, unidades y la sucursal del vendedor."
      title="Vendedores con más ventas"
      actions={
        <div className="flex flex-wrap gap-2">
          <ReportSelect
            value={metric}
            onValueChange={(v) => onMetricChange(v as SellersMetric)}
            className="w-28"
            options={[
              { value: 'revenue', label: 'Ventas' },
              { value: 'orders', label: 'Pedidos' },
            ]}
          />
          <ReportSelect
            value={limit.toString()}
            onValueChange={(v) => onLimitChange(Number(v) as TopLimit)}
            className="w-24"
            options={[
              { value: '5', label: 'Top 5' },
              { value: '10', label: 'Top 10' },
              { value: '20', label: 'Top 20' },
            ]}
          />
        </div>
      }
    >
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin ventas con vendedor en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{ valor: { label: METRIC_LABELS[metric], color: reportChartColors.blue } }}
          className="w-full aspect-auto"
          style={{ height: chartHeight }}
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 72 }}>
            <CartesianGrid horizontal={false} className={chartGrid} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="vendedor"
              tickLine={false}
              axisLine={false}
              width={190}
              interval={0}
              className={chartAxis}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                    return item ? `${item.nombreCompleto} · ${item.sucursal}` : null;
                  }}
                  formatter={(_value, _name, _item, _index, payload) => {
                    const p = payload as unknown as (typeof chartData)[number];
                    return (
                      <div className="flex w-full flex-col gap-1">
                        {[
                          ['Ventas', formatCurrencyAxis(p.ventas)],
                          ['Pedidos', formatNumber(p.pedidos)],
                          ['Unidades', formatNumber(p.unidades)],
                        ].map(([label, value]) => (
                          <div key={label} className="flex flex-1 items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i < PODIUM_COLORS.length ? PODIUM_COLORS[i] : reportChartColors.blue} />
              ))}
              <LabelList
                dataKey="valor"
                position="right"
                formatter={(value: number) => formatValue(value)}
                className="fill-muted-foreground text-[11px] tabular-nums"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
