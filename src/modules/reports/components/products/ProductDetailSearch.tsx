import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { PackageSearch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import { KpiCard } from '../shared/KpiCard';
import {
  chartAxis,
  chartGrid,
  chartQualitativeSeries,
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { ProductDetailData } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  selectedProductId: number | null;
  selectedProductTitle: string;
  detail: ProductDetailData | null;
  detailLoading: boolean;
}

interface DonutSlice {
  name: string;
  value: number;
  ingresos: number;
}

// Mini-donut de participación (por sede / por canal) con leyenda de puntos,
// mismo patrón del donut de métodos de pago del tab financiero.
function BreakdownDonut({ title, slices }: { title: string; slices: DonutSlice[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <ChartContainer config={{}} className="h-44 w-full aspect-auto">
        <PieChart>
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as DonutSlice;
              return (
                <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                  <p className="mb-1 font-medium">{p.name}</p>
                  <div className="grid gap-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Unidades</span>
                      <span className="font-mono tabular-nums">{formatNumber(p.value)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Ingresos</span>
                      <span className="font-mono tabular-nums">{formatCurrencyAxis(p.ingresos)}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Pie data={slices} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={2}>
            {slices.map((entry, index) => (
              <Cell key={entry.name} fill={chartQualitativeSeries[index % chartQualitativeSeries.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap gap-2">
        {slices.map((entry, index) => (
          <span key={entry.name} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartQualitativeSeries[index % chartQualitativeSeries.length] }}
            />
            {entry.name}: {formatNumber(entry.value)} uds
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProductDetailSearch({
  selectedProductId,
  selectedProductTitle,
  detail,
  detailLoading,
}: Props) {
  const chartData = detail?.sales_over_time.map((d) => ({
    fecha: d.period,
    ventas: d.total_revenue,
    unidades: d.total_quantity,
  })) ?? [];

  const branchSlices: DonutSlice[] =
    detail?.by_branch
      .filter((b) => b.total_quantity > 0)
      .map((b) => ({ name: b.branch_name, value: b.total_quantity, ingresos: b.total_revenue })) ?? [];

  const saleTypeSlices: DonutSlice[] =
    detail?.by_sale_type
      .filter((st) => st.total_quantity > 0)
      .map((st) => ({ name: st.sale_type_name, value: st.total_quantity, ingresos: st.total_revenue })) ?? [];

  const variationData =
    detail?.top_variations.map((v) => ({
      sku: v.sku,
      unidades: v.total_quantity,
      ingresos: v.total_revenue,
    })) ?? [];

  return (
    <ReportCard title="Análisis de producto individual">
      {selectedProductId === null && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <PackageSearch className="w-10 h-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Selecciona un producto en el filtro <span className="font-medium">"Más filtros +"</span> y da clic en <span className="font-medium">"Aplicar"</span> para ver su análisis individual.
          </p>
        </div>
      )}

      {selectedProductId !== null && detailLoading && (
        <ChartLoading />
      )}

      {selectedProductId !== null && detail && !detailLoading && (
        <div className="space-y-6">
          <div>
            <p className="text-base font-semibold">
              {detail.product_info?.title ?? selectedProductTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {detail.product_info?.variations?.map((v) => v.sku).join(', ')}
            </p>
          </div>

          {/* KPIs del periodo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KpiCard title="Cantidad vendida" value={detail.kpis.total_quantity} suffix=" uds" />
            <KpiCard title="Monto vendido" value={formatCurrency(detail.kpis.total_revenue)} />
          </div>

          {/* Stock by warehouse */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {detail.current_stock.map((s) => (
              <Card key={s.warehouse_id} className="border-t-4 border-t-primary">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{s.warehouse_name}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{s.total_stock}</p>
                  <p className="text-xs text-muted-foreground">unidades en stock</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desglose por sede / canal */}
          {(branchSlices.length > 0 || saleTypeSlices.length > 0) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {branchSlices.length > 0 && <BreakdownDonut title="Por sede" slices={branchSlices} />}
              {saleTypeSlices.length > 0 && (
                <BreakdownDonut title="Por canal de venta" slices={saleTypeSlices} />
              )}
            </div>
          )}

          {/* Sales over time */}
          {chartData.length > 0 ? (
            <ChartContainer
              config={{
                ventas: { label: 'Ventas', color: reportChartColors.indigo },
                unidades: { label: 'Unidades', color: reportChartColors.emerald },
              }}
              className="h-56 w-full aspect-auto"
            >
              <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                <defs>
                  <linearGradient id="fill-detail-ventas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-ventas)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-ventas)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fill-detail-unidades" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-unidades)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-unidades)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} className={chartGrid} />
                <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
                <Area
                  dataKey="ventas"
                  type="monotone"
                  fill="url(#fill-detail-ventas)"
                  stroke="var(--color-ventas)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="unidades"
                  type="monotone"
                  fill="url(#fill-detail-unidades)"
                  stroke="var(--color-unidades)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyReportState>
              Sin ventas en el periodo seleccionado
            </EmptyReportState>
          )}

          {/* Top variations */}
          {variationData.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Variaciones más vendidas</p>
              <ChartContainer
                config={{ unidades: { label: 'Unidades', color: reportChartColors.teal } }}
                className="w-full aspect-auto"
                style={{ height: Math.max(112, variationData.length * 36) }}
              >
                <BarChart data={variationData} layout="vertical" margin={{ left: 8, right: 56 }}>
                  <CartesianGrid horizontal={false} className={chartGrid} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="sku"
                    tickLine={false}
                    axisLine={false}
                    width={132}
                    className={chartAxis}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, _item, _index, payload) => (
                          <div className="flex w-full flex-col gap-1">
                            <div className="flex flex-1 items-center justify-between leading-none">
                              <span className="text-muted-foreground">Unidades</span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatNumber(value as number)}
                              </span>
                            </div>
                            <div className="flex flex-1 items-center justify-between leading-none">
                              <span className="text-muted-foreground">Ingresos</span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatCurrencyAxis((payload as unknown as { ingresos: number }).ingresos)}
                              </span>
                            </div>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="unidades" fill="var(--color-unidades)" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="unidades"
                      position="right"
                      formatter={(value: number) => formatNumber(value)}
                      className="fill-muted-foreground text-[11px] tabular-nums"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </div>
      )}
    </ReportCard>
  );
}
