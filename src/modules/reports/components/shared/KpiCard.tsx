import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/utils/utils';

type DeltaType = 'increase' | 'moderateIncrease' | 'unchanged' | 'moderateDecrease' | 'decrease';

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
    <div className="mt-2 h-8 w-24 rounded bg-muted animate-pulse" />
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
  const normalizedDeltaType = deltaType?.toLowerCase();
  const DeltaIcon = normalizedDeltaType?.includes('increase')
    ? ArrowUpRight
    : normalizedDeltaType?.includes('decrease')
      ? ArrowDownRight
      : ArrowRight;
  const deltaClassName = normalizedDeltaType?.includes('increase')
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : normalizedDeltaType?.includes('decrease')
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        {loading ? (
          <Skeleton />
        ) : (
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {prefix}{typeof value === 'number' ? value.toLocaleString('es-PE') : value}{suffix}
          </p>
        )}
        {(subtitle || delta !== undefined) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {delta !== undefined && deltaType && (
              <Badge variant="outline" className={cn('gap-1 px-2 py-0.5', deltaClassName)}>
                <DeltaIcon className="h-3 w-3" />
                {delta > 0 ? '+' : ''}{delta}%
              </Badge>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
