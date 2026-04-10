import { Metric, Text, Flex, BadgeDelta } from '@tremor/react';
import { Card } from '@/components/ui/card';
import type { DeltaType } from '@tremor/react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: number;
  deltaType?: DeltaType;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
}

function Skeleton() {
  return (
    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  delta,
  deltaType,
  loading,
  prefix = '',
  suffix = '',
}: KpiCardProps) {
  return (
    <Card className="max-w-xs h-full p-4">
      <Text>{title}</Text>
      {loading ? (
        <Skeleton />
      ) : (
        <Metric className="mt-1">
          {prefix}{typeof value === 'number' ? value.toLocaleString('es-PE') : value}{suffix}
        </Metric>
      )}
      {(subtitle || delta !== undefined) && (
        <Flex className="mt-2" justifyContent="start" alignItems="center">
          {delta !== undefined && deltaType && (
            <BadgeDelta deltaType={deltaType} size="xs">
              {delta > 0 ? '+' : ''}{delta}%
            </BadgeDelta>
          )}
          {subtitle && <Text className="ml-2 text-xs text-muted-foreground">{subtitle}</Text>}
        </Flex>
      )}
    </Card>
  );
}
