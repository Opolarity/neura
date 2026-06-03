import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartLoading, ReportCard, ReportSelect } from '../shared/ReportScaffold';
import type { TopCustomer, LoyaltyLevel } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  data: TopCustomer[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

const LOYALTY_BADGE_CLASS: Record<LoyaltyLevel, string> = {
  sin_nivel: 'border-slate-200 bg-slate-50 text-slate-700',
  L1: 'border-sky-200 bg-sky-50 text-sky-700',
  L2: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  L3: 'border-violet-200 bg-violet-50 text-violet-700',
  L4: 'border-amber-200 bg-amber-50 text-amber-700',
};

export function TopCustomersTable({ data, loading, limit, onLimitChange }: Props) {
  return (
    <ReportCard
      title="Top clientes"
      actions={
        <ReportSelect
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
          className="w-24"
          options={[
            { value: '5', label: 'Top 5' },
            { value: '10', label: 'Top 10' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading className="h-40" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Total gastado</TableHead>
              <TableHead>Nivel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c, i) => (
              <TableRow key={`${c.document_number}-${i}`}>
                <TableCell>
                  <Badge variant="outline" className={i < 3 ? 'border-amber-200 bg-amber-50 text-amber-700' : ''}>{i + 1}</Badge>
                </TableCell>
                <TableCell className="font-medium text-sm">{c.customer_name}</TableCell>
                <TableCell className="text-right">{c.order_count}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(c.total_spent)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={LOYALTY_BADGE_CLASS[c.loyalty_level]}>
                    {c.loyalty_level === 'sin_nivel' ? 'Sin nivel' : c.loyalty_level}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportCard>
  );
}
