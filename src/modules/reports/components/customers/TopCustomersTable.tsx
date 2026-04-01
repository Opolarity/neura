import {
  Card, Title, Table, TableHead, TableHeaderCell, TableBody,
  TableRow, TableCell, Badge, Select, SelectItem,
} from '@tremor/react';
import type { TopCustomer, LoyaltyLevel } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  data: TopCustomer[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

const LOYALTY_BADGE_COLOR: Record<LoyaltyLevel, string> = {
  sin_nivel: 'slate',
  L1: 'sky',
  L2: 'indigo',
  L3: 'violet',
  L4: 'amber',
};

export function TopCustomersTable({ data, loading, limit, onLimitChange }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Title>Top clientes</Title>
        <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v))} className="w-20">
          <SelectItem value="5">Top 5</SelectItem>
          <SelectItem value="10">Top 10</SelectItem>
        </Select>
      </div>
      {loading ? (
        <div className="h-40 bg-muted animate-pulse rounded" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>#</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell className="text-right">Pedidos</TableHeaderCell>
              <TableHeaderCell className="text-right">Total gastado</TableHeaderCell>
              <TableHeaderCell>Nivel</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((c, i) => (
              <TableRow key={`${c.document_number}-${i}`}>
                <TableCell>
                  <Badge color={i < 3 ? 'amber' : 'slate'} size="xs">{i + 1}</Badge>
                </TableCell>
                <TableCell className="font-medium text-sm">{c.customer_name}</TableCell>
                <TableCell className="text-right">{c.order_count}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(c.total_spent)}</TableCell>
                <TableCell>
                  <Badge color={LOYALTY_BADGE_COLOR[c.loyalty_level] as never} size="xs">
                    {c.loyalty_level === 'sin_nivel' ? 'Sin nivel' : c.loyalty_level}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
