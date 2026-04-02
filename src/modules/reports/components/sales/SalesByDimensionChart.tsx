import { Card, Title, BarChart } from '@tremor/react';
import type { SalesByDimensionItem, SalesDimension } from '../../types/reports.types';

interface DimensionBlock {
  data: SalesByDimensionItem[];
  loading: boolean;
}

interface Props {
  dimensions: Record<SalesDimension, DimensionBlock>;
}

const DIMENSION_LABELS: Record<SalesDimension, string> = {
  branch: 'Sucursal',
  sale_type: 'Canal de venta',
  payment_method: 'Método de pago',
  situation: 'Estado de pedido',
  state: 'Departamento',
  city: 'Ciudad',
  neighborhood: 'Distrito',
};

const ALL_DIMENSIONS: SalesDimension[] = [
  'branch', 'sale_type', 'payment_method', 'situation', 'state', 'city', 'neighborhood',
];

const TOP5_DIMENSIONS: SalesDimension[] = ['state', 'city', 'neighborhood'];

export function SalesByDimensionChart({ dimensions }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {ALL_DIMENSIONS.map((dim) => {
        const { data, loading } = dimensions[dim];
        const sliced = TOP5_DIMENSIONS.includes(dim)
          ? [...data]
              .filter((d) => d.label !== null && !/^sin /i.test(d.label))
              .sort((a, b) => b.total_revenue - a.total_revenue)
              .slice(0, 5)
          : data;
        const chartData = sliced.map((d) => ({
          Dimensión: d.label,
          'Ventas (S/)': d.total_revenue,
        }));

        return (
          <Card key={dim}>
            <Title>Ventas por {DIMENSION_LABELS[dim]}</Title>
            {loading ? (
              <div className="h-40 bg-muted animate-pulse rounded mt-4" />
            ) : (
              <BarChart
                data={chartData}
                index="Dimensión"
                categories={['Ventas (S/)']}
                colors={['blue']}
                valueFormatter={(v) => `S/ ${v.toLocaleString('es-PE')}`}
                layout="vertical"
                yAxisWidth={130}
                showLegend={false}
                className="mt-4"
                style={{ height: Math.max(chartData.length * 40, 120) }}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}
