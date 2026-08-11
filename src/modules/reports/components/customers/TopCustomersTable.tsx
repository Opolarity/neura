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
import { chartBadgeStyle, loyaltyBadgeColors, reportChartColors } from '../shared/reportChartUtils';
import type { TopCustomer } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  data: TopCustomer[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

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
                  <Badge variant="outline" style={i < 3 ? chartBadgeStyle(reportChartColors.amber) : undefined}>{i + 1}</Badge>
                </TableCell>
                <TableCell className="font-medium text-sm">{c.customer_name}</TableCell>
                <TableCell className="text-right">{c.order_count}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(c.total_spent)}</TableCell>
                <TableCell>
                  <Badge variant="outline" style={chartBadgeStyle(loyaltyBadgeColors[c.loyalty_level])}>
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
