import { Title, BarChart, Select, SelectItem } from '@tremor/react';
import { Card } from '@/components/ui/card';
import type { TopReturnedProduct } from '../../types/reports.types';

interface Props {
  data: TopReturnedProduct[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

export function TopReturnedProductsChart({ data, loading, limit, onLimitChange }: Props) {
  const chartData = data.map((d) => ({
    Producto: d.product_title.length > 20 ? d.product_title.slice(0, 20) + '…' : d.product_title,
    'N° devoluciones': d.return_count,
    'Unidades devueltas': d.total_quantity_returned,
  }));

  return (
    <Card className='h-full p-4'>
      <div className="flex items-center justify-between mb-4">
        <Title>Productos más devueltos</Title>
        <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v))} className="w-20">
          <SelectItem value="5">Top 5</SelectItem>
          <SelectItem value="10">Top 10</SelectItem>
        </Select>
      </div>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded" />
      ) : (
        <BarChart
          data={chartData}
          index="Producto"
          categories={['N° devoluciones']}
          colors={['blue']}
          layout="vertical"
          className="h-48"
        />
      )}
    </Card>
  );
}
