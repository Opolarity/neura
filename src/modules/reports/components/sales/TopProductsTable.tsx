import {
  Title, Table, TableHead, TableHeaderCell, TableBody,
  TableRow, TableCell, Select, SelectItem, Badge,
} from '@tremor/react';
import type { TopProductItem, TopMetric, TopLimit } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';
import { Card } from '@/components/ui/card';

interface Props {
  data: TopProductItem[];
  loading: boolean;
  metric: TopMetric;
  limit: TopLimit;
  onMetricChange: (m: TopMetric) => void;
  onLimitChange: (l: TopLimit) => void;
}

export function TopProductsTable({ data, loading, metric, limit, onMetricChange, onLimitChange }: Props) {
  return (
    <Card className='h-full p-4'>
      <div className="flex items-center justify-between mb-4">
        <Title>Top productos</Title>
        <div className="flex gap-2">
          <Select value={metric} onValueChange={(v) => onMetricChange(v as TopMetric)} className="w-36">
            <SelectItem value="revenue">Por ingresos</SelectItem>
            <SelectItem value="quantity">Por cantidad</SelectItem>
          </Select>
          <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v) as TopLimit)} className="w-20">
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="20">Top 20</SelectItem>
          </Select>
        </div>
      </div>
      {loading ? (
        <div className="h-40 bg-muted animate-pulse rounded" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>#</TableHeaderCell>
              <TableHeaderCell>Producto</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell className="text-right">Unidades</TableHeaderCell>
              <TableHeaderCell className="text-right">Ingresos</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, i) => (
              <TableRow key={item.product_id}>
                <TableCell>
                  <Badge className='rounded-full w-[24px] h-[24px] flex justify-center items-center ring-0' color={i < 3 ? 'amber' : 'slate'} size="xs">{i + 1}</Badge>
                </TableCell>
                <TableCell className="font-medium">{item.product_title}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{item.sku}</TableCell>
                <TableCell className="text-right">{item.total_quantity.toLocaleString('es-PE')}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.total_revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
