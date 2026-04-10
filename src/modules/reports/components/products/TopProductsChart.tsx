import { Title, BarChart, Select, SelectItem } from '@tremor/react';
import type { TopProductItem, TopLimit, ProductsByCategoryItem } from '../../types/reports.types';
import { Card } from '@/components/ui/card';

interface Props {
  data: TopProductItem[];
  loading: boolean;
  limit: TopLimit;
  onLimitChange: (l: TopLimit) => void;
  categoryId: number | null;
  categories: ProductsByCategoryItem[];
  onCategoryChange: (id: number | null) => void;
}

const ALL = '__all__';

export function TopProductsChart({ data, loading, limit, onLimitChange, categoryId, categories, onCategoryChange }: Props) {
  const chartData = data.map((d) => ({
    Producto: d.product_title.length > 20 ? d.product_title.slice(0, 20) + '…' : d.product_title,
    'Ingresos (S/)': d.total_revenue,
    Unidades: d.total_quantity,
  }));

  return (
    <Card className='h-full p-4'>
      <div className="flex items-center justify-between mb-4">
        <Title>Productos más vendidos</Title>
        <div className="flex gap-2">
          <Select
            value={categoryId?.toString() ?? ALL}
            onValueChange={(v) => onCategoryChange(v === ALL ? null : Number(v))}
            className="w-40"
          >
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.category_id ?? 'null'} value={c.category_id?.toString() ?? 'null'}>
                {c.category_name}
              </SelectItem>
            ))}
          </Select>
          <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v) as TopLimit)} className="w-20">
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="20">Top 20</SelectItem>
          </Select>
        </div>
      </div>
      {loading ? (
        <div className="h-52 bg-muted animate-pulse rounded" />
      ) : (
        <BarChart
          data={chartData}
          index="Producto"
          categories={['Ingresos (S/)']}
          colors={['blue']}
          valueFormatter={(v) => `S/ ${v.toLocaleString('es-PE')}`}
          layout="vertical"
          className="h-52"
        />
      )}
    </Card>
  );
}
