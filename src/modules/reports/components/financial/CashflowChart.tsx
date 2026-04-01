import { Card, Title, AreaChart, Select, SelectItem } from '@tremor/react';
import type { CashflowItem, Granularity } from '../../types/reports.types';

interface Props {
  data: CashflowItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

export function CashflowChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    Fecha: d.period,
    'Ingresos (S/)': d.income,
    'Egresos (S/)': d.expense,
    'Neto (S/)': d.net,
  }));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Title>Flujo de caja en el tiempo</Title>
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
          categories={['Ingresos (S/)', 'Egresos (S/)']}
          colors={['emerald', 'rose']}
          valueFormatter={(v) => `S/ ${v.toLocaleString('es-PE')}`}
          className="h-48"
        />
      )}
    </Card>
  );
}
