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
import type { TopProductItem, TopMetric, TopLimit } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

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
    <ReportCard
      title="Top productos"
      actions={
        <div className="flex flex-wrap gap-2">
          <ReportSelect<TopMetric>
            value={metric}
            onValueChange={onMetricChange}
            className="w-36"
            options={[
              { value: 'revenue', label: 'Por ingresos' },
              { value: 'quantity', label: 'Por cantidad' },
            ]}
          />
          <ReportSelect
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(Number(value) as TopLimit)}
            className="w-24"
            options={[
              { value: '5', label: 'Top 5' },
              { value: '10', label: 'Top 10' },
              { value: '20', label: 'Top 20' },
            ]}
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
                  <Badge variant="outline" className={i < 3 ? 'border-amber-200 bg-amber-50 text-amber-700' : ''}>
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
