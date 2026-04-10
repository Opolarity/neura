import { Title, BarChart } from '@tremor/react';
import { Card } from '@/components/ui/card';
import type { StockMovementTypeItem } from '../../types/reports.types';

interface Props {
  data: StockMovementTypeItem[];
  loading: boolean;
}

export function StockMovementTypesChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    Tipo: d.type_name,
    Movimientos: d.movement_count,
    'Unidades totales': d.total_quantity,
  }));

  return (
    <Card className='h-full p-4'>
      <Title>Tipos de movimiento de inventario</Title>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded mt-4" />
      ) : (
        <BarChart
          data={chartData}
          index="Tipo"
          categories={['Movimientos', 'Unidades totales']}
          colors={['blue', 'sky']}
          className="h-48 mt-4"
        />
      )}
    </Card>
  );
}
