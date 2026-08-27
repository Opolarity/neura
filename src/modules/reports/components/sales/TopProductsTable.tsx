import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ReportCard, ReportSelect, ChartLoading } from '../shared/ReportScaffold';
import type { TopProductItem, TopMetric, TopLimit } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';
import { chartBadgeStyle, reportChartColors } from '../shared/reportChartUtils';

interface Props {
  data: TopProductItem[];
  loading: boolean;
  metric: TopMetric;
  limit: TopLimit;
  onMetricChange: (m: TopMetric) => void;
  onLimitChange: (l: TopLimit) => void;
}

const METRIC_OPTIONS: Array<{ value: TopMetric; label: string }> = [
  { value: 'revenue', label: 'Por ingresos' },
  { value: 'quantity', label: 'Por cantidad' },
];

const LIMIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '5', label: 'Top 5' },
  { value: '10', label: 'Top 10' },
  { value: '20', label: 'Top 20' },
];

export function TopProductsTable({ data, loading, metric, limit, onMetricChange, onLimitChange }: Props) {
  return (
    <ReportCard
      title="Top productos"
      actions={
        <div className="flex gap-2">
          <ReportSelect value={metric} onValueChange={onMetricChange} options={METRIC_OPTIONS} className="w-36" />
          <ReportSelect
            value={limit.toString()}
            onValueChange={(v) => onLimitChange(Number(v) as TopLimit)}
            options={LIMIT_OPTIONS}
            className="w-20"
          />
        </div>
      }
    >
      {loading ? (
        <ChartLoading className="h-40" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, i) => (
              <TableRow key={item.product_id}>
                <TableCell>
                  <Badge variant="outline" style={i < 3 ? chartBadgeStyle(reportChartColors.amber) : undefined}>
                    {i + 1}
                  </Badge>
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
    </ReportCard>
  );
}
