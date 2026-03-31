import { Card, Title, BarChart, Badge } from '@tremor/react';
import type { LoyaltyDistributionItem, CustomersByLoyaltyItem, LoyaltyLevel } from '../../types/reports.types';

interface Props {
  data: LoyaltyDistributionItem[];
  loading: boolean;
  byLoyalty: CustomersByLoyaltyItem[];
}

const LOYALTY_COLORS: Record<LoyaltyLevel, string> = {
  sin_nivel: 'slate',
  L1: 'sky',
  L2: 'indigo',
  L3: 'violet',
  L4: 'amber',
};

const LOYALTY_LABELS: Record<LoyaltyLevel, string> = {
  sin_nivel: 'Sin nivel',
  L1: 'Nivel 1 (150-749)',
  L2: 'Nivel 2 (750-1499)',
  L3: 'Nivel 3 (1500-2999)',
  L4: 'Nivel 4 (3000+)',
};

export function LoyaltyDistributionChart({ data, loading, byLoyalty }: Props) {
  const chartData = data.map((d) => ({
    Nivel: LOYALTY_LABELS[d.level] ?? d.level,
    Clientes: d.count,
  }));

  return (
    <Card>
      <Title>Distribución por nivel de fidelización</Title>
      {loading ? (
        <div className="h-48 bg-muted animate-pulse rounded mt-4" />
      ) : (
        <>
          <BarChart
            data={chartData}
            index="Nivel"
            categories={['Clientes']}
            colors={['indigo']}
            className="h-40 mt-4"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {data.map((d) => (
              <Badge key={d.level} color={LOYALTY_COLORS[d.level] as never} size="sm">
                {LOYALTY_LABELS[d.level]}: {d.count}
              </Badge>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
