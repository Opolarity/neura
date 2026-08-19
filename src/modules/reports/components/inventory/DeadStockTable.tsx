import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartLoading, ReportCard, ReportSelect } from '../shared/ReportScaffold';
import { chartBadgeStyle, formatNumber, reportChartColors } from '../shared/reportChartUtils';
import type { DeadStockReport } from '../../types/reports.types';

interface Props {
  report: DeadStockReport | undefined;
  loading: boolean;
  days: number;
  onDaysChange: (days: number) => void;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

const DAYS_OPTIONS = ['30', '60', '90', '180'] as const;

function ageBadgeColor(days: number | null) {
  if (days === null) return reportChartColors.slate;
  if (days < 90) return reportChartColors.amber;
  if (days < 180) return reportChartColors.orange;
  return reportChartColors.rose;
}

export function DeadStockTable({ report, loading, days, onDaysChange, page, pageSize, onPageChange }: Props) {
  const total = report?.page.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const data = report?.data ?? [];

  return (
    <ReportCard
      title="Stock sin rotación (stock muerto)"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-warning-soft bg-warning-soft text-warning-soft-foreground">
            {formatNumber(total)} SKUs
          </Badge>
          <ReportSelect
            value={String(days) as (typeof DAYS_OPTIONS)[number]}
            onValueChange={(v) => onDaysChange(Number(v))}
            options={DAYS_OPTIONS.map((value) => ({ value, label: `+${value} días` }))}
            className="w-28"
          />
        </div>
      }
    >
      {loading ? (
        <ChartLoading className="h-40" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Valor a costo</TableHead>
                <TableHead>Última salida</TableHead>
                <TableHead className="text-right">Días sin salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.product_variation_id}>
                  <TableCell className="font-medium text-sm">{item.product_title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatNumber(item.stock)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    S/ {formatNumber(item.cost_value)}
                  </TableCell>
                  <TableCell className="text-sm">{item.last_out_date ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {item.days_without_movement === null ? (
                      <Badge variant="pending">Sin salidas</Badge>
                    ) : (
                      <Badge variant="outline" style={chartBadgeStyle(ageBadgeColor(item.days_without_movement))}>
                        {formatNumber(item.days_without_movement)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">Pág {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </ReportCard>
  );
}
