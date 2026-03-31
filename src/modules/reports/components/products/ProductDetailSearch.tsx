import { Card, Title, TextInput, LineChart, Grid, Col, Text, Metric } from '@tremor/react';
import { Search } from 'lucide-react';
import type { ProductSearchResult, ProductDetailData } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: ProductSearchResult[];
  selectedProductId: number | null;
  onSelectProduct: (id: number | null) => void;
  detail: ProductDetailData | null;
  detailLoading: boolean;
}

export function ProductDetailSearch({
  searchQuery,
  onSearchChange,
  searchResults,
  selectedProductId,
  onSelectProduct,
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
      <div className="relative mb-4">
        <TextInput
          icon={Search}
          placeholder="Buscar producto por nombre o SKU..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchResults.length > 0 && !selectedProductId && (
          <div className="absolute z-10 mt-1 w-full bg-background border border-input rounded-md shadow-md max-h-48 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={r.id}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => {
                  onSelectProduct(r.id);
                  onSearchChange(r.title);
                }}
              >
                <span className="font-medium">{r.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{r.sku}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProductId && (
        <button
          className="text-xs text-muted-foreground underline mb-4"
          onClick={() => { onSelectProduct(null); onSearchChange(''); }}
        >
          ✕ Limpiar selección
        </button>
      )}

      {detailLoading && (
        <div className="h-48 bg-muted animate-pulse rounded" />
      )}

      {detail && !detailLoading && (
        <div className="space-y-6">
          <div>
            <Text className="font-semibold text-base">{detail.product_info.title}</Text>
            <Text className="text-xs text-muted-foreground">
              {detail.product_info.variations.map((v) => v.sku).join(', ')}
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
