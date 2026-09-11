import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/shared/utils/utils';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateDisplay } from '@/shared/utils/date';
import { ChartLoading, EmptyReportState, ReportCard } from '../shared/ReportScaffold';
import type { SellerSummaryItem } from '../../types/reports.types';

interface Props {
  data: SellerSummaryItem[];
  loading: boolean;
}

type SortKey = 'seller_name' | 'branch_name' | 'orders' | 'units' | 'revenue' | 'avg_ticket' | 'share_pct' | 'last_order';
type SortDir = 'asc' | 'desc';

const COLUMNS: Array<{ key: SortKey; label: string; align: 'left' | 'right' }> = [
  { key: 'seller_name', label: 'Vendedor', align: 'left' },
  { key: 'branch_name', label: 'Sucursal', align: 'left' },
  { key: 'orders', label: 'Pedidos', align: 'right' },
  { key: 'units', label: 'Unidades', align: 'right' },
  { key: 'revenue', label: 'Ventas', align: 'right' },
  { key: 'avg_ticket', label: 'Ticket prom.', align: 'right' },
  { key: 'share_pct', label: 'Participación', align: 'right' },
  { key: 'last_order', label: 'Última venta', align: 'right' },
];

/** Detalle por vendedor, ordenable por columna. "Sin vendedor" va siempre al final. */
export function SellersTable({ data, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'seller_name' || key === 'branch_name' ? 'asc' : 'desc');
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      // Sin vendedor no es una persona: cierra la tabla sin importar el orden.
      if (a.seller_id === null && b.seller_id !== null) return 1;
      if (b.seller_id === null && a.seller_id !== null) return -1;
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb, 'es', { sensitivity: 'base' }) * dir;
      }
      return ((va as number) - (vb as number)) * dir;
    });
  }, [data, sortKey, sortDir]);

  const totals = data.reduce(
    (acc, d) => ({ orders: acc.orders + d.orders, units: acc.units + d.units, revenue: acc.revenue + d.revenue }),
    { orders: 0, units: 0, revenue: 0 },
  );

  return (
    <ReportCard
      info="Una fila por vendedor con todo el período: pedidos, unidades netas de devoluciones, ventas (valor del pedido), ticket promedio, participación sobre la venta total y fecha de la última venta. La sucursal es la asignada al usuario en su perfil. Sin vendedor agrupa las ventas de web y chatbot. Hacé clic en un encabezado para ordenar."
      title="Detalle por vendedor"
    >
      {loading ? (
        <ChartLoading className="h-40" />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo</EmptyReportState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <TableHead key={col.key} className={cn(col.align === 'right' && 'text-right')}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={cn(
                        'inline-flex items-center gap-1 select-none hover:text-foreground',
                        active && 'text-foreground',
                        col.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {col.label}
                      <Icon className={cn('h-3.5 w-3.5', !active && 'opacity-40')} />
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.seller_id ?? 'none'} className={cn(item.seller_id === null && 'text-muted-foreground')}>
                <TableCell className="font-medium text-sm">
                  {item.seller_id === null ? (
                    <Badge variant="outline">Sin vendedor (web / chatbot)</Badge>
                  ) : (
                    item.seller_name
                  )}
                </TableCell>
                <TableCell className="text-sm">{item.seller_id === null ? '—' : item.branch_name}</TableCell>
                <TableCell className="text-right tabular-nums">{item.orders.toLocaleString('es-PE')}</TableCell>
                <TableCell className="text-right tabular-nums">{item.units.toLocaleString('es-PE')}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{formatCurrency(item.revenue)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(item.avg_ticket)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.share_pct !== null ? `${item.share_pct}%` : '—'}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {item.last_order ? formatDateDisplay(item.last_order) : '—'}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 font-medium">
              <TableCell>Total</TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums">{totals.orders.toLocaleString('es-PE')}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.units.toLocaleString('es-PE')}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.revenue)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {totals.orders > 0 ? formatCurrency(totals.revenue / totals.orders) : '—'}
              </TableCell>
              <TableCell className="text-right tabular-nums">100%</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      )}
    </ReportCard>
  );
}
