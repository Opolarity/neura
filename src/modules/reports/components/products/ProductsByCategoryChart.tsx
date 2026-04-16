import { Card, Title, BarChart } from '@tremor/react';
import type { ProductsByCategoryItem } from '../../types/reports.types';

interface Props {
  data: ProductsByCategoryItem[];
  loading: boolean;
}

export function ProductsByCategoryChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    Categoría: d.category_name,
    Unidades: d.total_quantity,
  }));

  return (
    <Card>
      <Title>Ventas por categoría</Title>
      {loading ? (
        <div className="h-72 bg-muted animate-pulse rounded mt-4" />
      ) : (
        <BarChart
          data={chartData}
          index="Categoría"
          categories={['Unidades']}
          colors={['indigo']}
          valueFormatter={(v) => `${v.toLocaleString('es-PE')} uds`}
          className="h-72 mt-4"
          showLegend={false}
        />
      )}
    </Card>
  );
}
