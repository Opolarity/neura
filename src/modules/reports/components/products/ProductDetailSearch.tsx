import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { PackageSearch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
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

  return (
    <ReportCard title="Análisis de producto individual">
      {selectedProductId === null && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <PackageSearch className="w-10 h-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Selecciona un producto en el filtro <span className="font-medium">"Más opciones +"</span> para ver su análisis individual.
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

          {/* Sales over time */}
          {chartData.length > 0 ? (
            <ChartContainer
              config={{
                ventas: { label: 'Ventas', color: reportChartColors.indigo },
                unidades: { label: 'Unidades', color: reportChartColors.emerald },
              }}
              className="h-56 w-full aspect-auto"
            >
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} className={chartGrid} />
                <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
                <Line dataKey="ventas" type="monotone" stroke="var(--color-ventas)" strokeWidth={2} dot={false} />
                <Line dataKey="unidades" type="monotone" stroke="var(--color-unidades)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyReportState>
              Sin ventas en el periodo seleccionado
            </EmptyReportState>
          )}

          {/* Top variations */}
          {detail.top_variations.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Variaciones más vendidas</p>
              <div className="space-y-1">
                {detail.top_variations.map((v) => (
                  <div key={v.variation_id} className="flex justify-between text-sm py-1 border-b">
                    <span className="text-muted-foreground">{v.sku}</span>
                    <span>{v.total_quantity} uds · {formatCurrency(v.total_revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ReportCard>
  );
}
