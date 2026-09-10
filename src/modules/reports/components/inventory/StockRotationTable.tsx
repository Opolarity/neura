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
import { ChartLoading, ReportCard } from '../shared/ReportScaffold';
import type { StockRotationItem } from '../../types/reports.types';

interface Props {
  data: StockRotationItem[];
  loading: boolean;
}

type SortKey = 'product_title' | 'sku' | 'units_sold' | 'current_stock' | 'rotation_rate';
type SortDir = 'asc' | 'desc';

const COLUMNS: Array<{ key: SortKey; label: string; align: 'left' | 'right' | 'center' }> = [
  { key: 'product_title', label: 'Producto', align: 'left' },
  { key: 'sku', label: 'SKU', align: 'left' },
  { key: 'units_sold', label: 'Unidades vendidas', align: 'right' },
  { key: 'current_stock', label: 'Stock actual', align: 'right' },
  { key: 'rotation_rate', label: 'Rotación', align: 'center' },
];

function RotationBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <Badge variant="outline">Sin stock</Badge>;
  if (rate >= 3) return <Badge variant="outline" className="border-success-soft bg-success-soft text-success-soft-foreground">Alta ({rate}x)</Badge>;
  if (rate >= 1) return <Badge variant="outline" className="border-warning-soft bg-warning-soft text-warning-soft-foreground">Media ({rate}x)</Badge>;
  return <Badge variant="outline" className="border-destructive-soft bg-destructive-soft text-destructive-soft-foreground">Baja ({rate}x)</Badge>;
}

export function StockRotationTable({ data, loading }: Props) {
  // Orden en cliente: el SP devuelve un top acotado, así que reordenar las
  // mismas filas no cambia el universo, solo la lectura.
  const [sortKey, setSortKey] = useState<SortKey>('units_sold');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Texto arranca A→Z; números y rotación, de mayor a menor.
      setSortDir(key === 'product_title' || key === 'sku' ? 'asc' : 'desc');
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      // "Sin stock" (rotación null) siempre al final, sin importar el sentido.
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb, 'es', { sensitivity: 'base' }) * dir;
      }
      return ((va as number) - (vb as number)) * dir;
    });
  }, [data, sortKey, sortDir]);

  return (
    <ReportCard info="Por SKU, unidades vendidas en el período contra el stock actual. La rotación es vendidas ÷ stock: Alta desde 3, Media desde 1, Baja por debajo. Sin stock significa que no hay unidades hoy contra qué comparar." title="Análisis de rotación de inventario">
      {loading ? (
        <ChartLoading className="h-40" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
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
              <TableRow key={item.variation_id}>
                <TableCell className="font-medium text-sm">{item.product_title}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{item.sku}</TableCell>
                <TableCell className="text-right">{item.units_sold.toLocaleString('es-PE')}</TableCell>
                <TableCell className="text-right">{item.current_stock.toLocaleString('es-PE')}</TableCell>
                <TableCell className="text-center">
                  <RotationBadge rate={item.rotation_rate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportCard>
  );
}
