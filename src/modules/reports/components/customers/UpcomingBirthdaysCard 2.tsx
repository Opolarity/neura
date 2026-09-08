import { Badge } from '@/components/ui/badge';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartBadgeStyle,
  loyaltyBadgeColors,
} from '../shared/reportChartUtils';
import type { UpcomingBirthdayItem } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  data: UpcomingBirthdayItem[];
  loading: boolean;
  days: number;
  onDaysChange: (d: number) => void;
}

function formatBirthday(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'long' });
}

function daysLabel(days: number) {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

export function UpcomingBirthdaysCard({ data, loading, days, onDaysChange }: Props) {
  return (
    <ReportCard
      title="Próximos cumpleaños"
      actions={
        <ReportSelect
          value={days.toString()}
          onValueChange={(value) => onDaysChange(Number(value))}
          className="w-28"
          options={[
            { value: '15', label: '15 días' },
            { value: '30', label: '30 días' },
            { value: '60', label: '60 días' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading className="h-40" />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin cumpleaños registrados en los próximos {days} días</EmptyReportState>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((c) => (
            <li key={`${c.user_name}-${c.next_birthday}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.user_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBirthday(c.next_birthday)} · {daysLabel(c.days_until)}
                  {c.order_count > 0 && <> · {c.order_count} pedidos · {formatCurrency(c.total_spent)}</>}
                </p>
              </div>
              <Badge variant="outline" style={chartBadgeStyle(loyaltyBadgeColors[c.loyalty_level])}>
                {c.loyalty_level === 'sin_nivel' ? 'Sin nivel' : c.loyalty_level}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}
