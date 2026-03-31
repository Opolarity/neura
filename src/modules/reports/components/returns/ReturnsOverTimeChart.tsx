import { Card, Title, AreaChart, Select, SelectItem } from '@tremor/react';
import type { ReturnsOverTimeItem, Granularity } from '../../types/reports.types';

interface Props {
  data: ReturnsOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

export function ReturnsOverTimeChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    Fecha: d.period,
    'Devoluciones': d.return_count,
    'Reembolso (S/)': d.total_refund_amount,
  }));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Title>Devoluciones en el tiempo</Title>
        <Select value={granularity} onValueChange={(v) => onGranularityChange(v as Granularity)} className="w-32">
          <SelectItem value="day">Diario</SelectItem>
          <SelectItem value="week">Semanal</SelectItem>
          <SelectItem value="month">Mensual</SelectItem>
        </Select>
      </div>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded" />
      ) : (
        <AreaChart
          data={chartData}
          index="Fecha"
          categories={['Devoluciones', 'Reembolso (S/)']}
          colors={['rose', 'orange']}
          className="h-48"
        />
      )}
    </Card>
  );
}
