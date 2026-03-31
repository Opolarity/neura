import { Card, Title, DonutChart, Legend } from '@tremor/react';
import type { FinancialByPaymentItem } from '../../types/reports.types';

interface Props {
  data: FinancialByPaymentItem[];
  loading: boolean;
}

export function FinancialByPaymentChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    name: d.payment_method_name,
    value: d.income,
  }));

  return (
    <Card>
      <Title>Ingresos por método de pago</Title>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded mt-4" />
      ) : (
        <>
          <DonutChart
            data={chartData}
            category="value"
            index="name"
            valueFormatter={(v) => `S/ ${v.toLocaleString('es-PE')}`}
            colors={['emerald', 'teal', 'cyan', 'sky', 'indigo', 'violet']}
            className="h-40 mt-4"
          />
          <Legend
            categories={chartData.map((d) => d.name)}
            colors={['emerald', 'teal', 'cyan', 'sky', 'indigo', 'violet']}
            className="mt-3"
          />
        </>
      )}
    </Card>
  );
}
