import { Title, AreaChart, Select, SelectItem } from '@tremor/react';
import type { SalesOverTimeItem, Granularity } from '../../types/reports.types';
import { Card } from '@/components/ui/card';

interface Props {
  data: SalesOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

const GRANULARITY_LABELS: Record<Granularity, string> = {
  day: 'Diario',
  week: 'Semanal',
  month: 'Mensual',
};

export function SalesOverTimeChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    Fecha: d.period,
    'Ventas (S/)': d.total_revenue,
    'Pedidos': d.order_count,
  }));

  return (
    <Card className='h-full p-4'>
      <div className="flex items-center justify-between mb-4">
        <Title>Ventas en el tiempo</Title>
        <Select
          value={granularity}
          onValueChange={(v) => onGranularityChange(v as Granularity)}
          className="w-32"
        >
          {(Object.entries(GRANULARITY_LABELS) as [Granularity, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </Select>
      </div>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded" />
      ) : (
        <AreaChart
          data={chartData}
          index="Fecha"
          categories={['Ventas (S/)']}
          colors={['blue']}
          valueFormatter={(v) => `S/ ${v.toLocaleString('es-PE')}`}
          showLegend
          showGridLines
          yAxisWidth={90}
          className="h-48"
        />
      )}
    </Card>
  );
}
