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
import { ChartLoading, ReportCard } from '../shared/ReportScaffold';
import type { LowStockProduct } from '../../types/reports.types';

interface Props {
  data: LowStockProduct[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export function LowStockTable({ data, loading, total, page, pageSize, onPageChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <ReportCard
      title="Productos con stock bajo"
      actions={<Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{total} productos</Badge>}
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
                <TableHead>Almacén</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={`${item.product_variation_id}-${item.warehouse_id}`}>
                  <TableCell className="font-medium text-sm">{item.product_title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-sm">{item.warehouse_name}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={item.stock === 0 ? 'destructive' : 'outline'}
                      className={item.stock === 0 ? '' : 'border-amber-200 bg-amber-50 text-amber-700'}
                    >
                      {item.stock}
                    </Badge>
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
