import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartLoading, ReportCard } from '../shared/ReportScaffold';
import type { StockRotationItem } from '../../types/reports.types';

interface Props {
  data: StockRotationItem[];
  loading: boolean;
}

function RotationBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <Badge variant="outline">Sin stock</Badge>;
  if (rate >= 3) return <Badge variant="outline" className="border-success-soft bg-success-soft text-success-soft-foreground">Alta ({rate}x)</Badge>;
  if (rate >= 1) return <Badge variant="outline" className="border-warning-soft bg-warning-soft text-warning-soft-foreground">Media ({rate}x)</Badge>;
  return <Badge variant="outline" className="border-destructive-soft bg-destructive-soft text-destructive-soft-foreground">Baja ({rate}x)</Badge>;
}

export function StockRotationTable({ data, loading }: Props) {
  return (
    <ReportCard title="Análisis de rotación de inventario">
      {loading ? (
        <ChartLoading className="h-40" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Unidades vendidas</TableHead>
              <TableHead className="text-right">Stock actual</TableHead>
              <TableHead className="text-center">Rotación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
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
