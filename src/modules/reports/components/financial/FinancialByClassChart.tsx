import { Title, BarChart } from '@tremor/react';
import { Card } from '@/components/ui/card';
import type { FinancialByClassItem } from '../../types/reports.types';

interface Props {
  data: FinancialByClassItem[];
  loading: boolean;
}

export function FinancialByClassChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    Clase: d.class_name,
    'Ingresos (S/)': d.income,
    'Egresos (S/)': d.expense,
  }));

  return (
    <Card className='h-full p-4'>
      <Title>Por clase de movimiento</Title>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded mt-4" />
      ) : (
        <BarChart
          data={chartData}
          index="Clase"
          categories={['Ingresos (S/)', 'Egresos (S/)']}
          colors={['emerald', 'rose']}
          valueFormatter={(v) => `S/ ${v.toLocaleString('es-PE')}`}
          className="h-48 mt-4"
        />
      )}
    </Card>
  );
}
