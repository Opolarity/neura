import { Card, Title, LineChart, Grid, Col, Text, Metric } from '@tremor/react';
import { PackageSearch } from 'lucide-react';
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
    Fecha: d.period,
    'Ventas (S/)': d.total_revenue,
    Unidades: d.total_quantity,
  })) ?? [];

  return (
    <Card>
      <Title className="mb-4">Análisis de producto individual</Title>

      {selectedProductId === null && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <PackageSearch className="w-10 h-10 text-muted-foreground/60" />
          <Text className="text-muted-foreground text-sm">
            Selecciona un producto en el filtro <span className="font-medium">"Más opciones +"</span> para ver su análisis individual.
          </Text>
        </div>
      )}

      {selectedProductId !== null && detailLoading && (
        <div className="h-48 bg-muted animate-pulse rounded" />
      )}

      {selectedProductId !== null && detail && !detailLoading && (
        <div className="space-y-6">
          <div>
            <Text className="font-semibold text-base">
              {detail.product_info?.title ?? selectedProductTitle}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {detail.product_info?.variations?.map((v) => v.sku).join(', ')}
            </Text>
          </div>

          {/* Stock by warehouse */}
          <Grid numItemsSm={2} numItemsLg={4} className="gap-3">
            {detail.current_stock.map((s) => (
              <Col key={s.warehouse_id}>
                <Card decoration="top" decorationColor="blue">
                  <Text>{s.warehouse_name}</Text>
                  <Metric>{s.total_stock}</Metric>
                  <Text className="text-xs text-muted-foreground">unidades en stock</Text>
                </Card>
              </Col>
            ))}
          </Grid>

          {/* Sales over time */}
          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              index="Fecha"
              categories={['Ventas (S/)', 'Unidades']}
              colors={['indigo', 'emerald']}
              valueFormatter={(v) => v.toLocaleString('es-PE')}
              className="h-48"
            />
          ) : (
            <Text className="text-muted-foreground text-sm text-center py-8">
              Sin ventas en el periodo seleccionado
            </Text>
          )}

          {/* Top variations */}
          {detail.top_variations.length > 0 && (
            <div>
              <Text className="font-medium mb-2">Variaciones más vendidas</Text>
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
    </Card>
  );
}
