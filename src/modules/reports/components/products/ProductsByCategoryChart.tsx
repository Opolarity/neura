import { Card, Title, DonutChart, Legend } from '@tremor/react';
import type { ProductsByCategoryItem } from '../../types/reports.types';

interface Props {
  data: ProductsByCategoryItem[];
  loading: boolean;
}

export function ProductsByCategoryChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    name: d.category_name,
    value: d.total_quantity,
  }));

  return (
    <Card>
      <Title>Ventas por categoría</Title>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded mt-4" />
      ) : (
        <>
          <DonutChart
            data={chartData}
            category="value"
            index="name"
            valueFormatter={(v) => `${v.toLocaleString('es-PE')} uds`}
            colors={['indigo', 'cyan', 'amber', 'rose', 'emerald', 'violet', 'orange', 'sky']}
            className="h-48 mt-4"
          />
          <Legend
            categories={chartData.map((d) => d.name)}
            colors={['indigo', 'cyan', 'amber', 'rose', 'emerald', 'violet', 'orange', 'sky']}
            className="mt-3"
          />
        </>
      )}
    </Card>
  );
}
