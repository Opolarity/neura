import { Card, Title, DonutChart } from '@tremor/react';
import type { ReturnsByReasonItem } from '../../types/reports.types';

interface Props {
  data: ReturnsByReasonItem[];
  loading: boolean;
}

export function ReturnsByReasonChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    name: d.reason,
    value: d.count,
  }));

  return (
    <Card>
      <Title>Devoluciones por motivo</Title>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded mt-4" />
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Sin datos en el periodo</p>
      ) : (
        <DonutChart
          data={chartData}
          category="value"
          index="name"
          valueFormatter={(v) => `${v} dev.`}
          colors={['rose', 'orange', 'amber', 'red', 'pink', 'fuchsia']}
          className="h-48 mt-4"
        />
      )}
    </Card>
  );
}
