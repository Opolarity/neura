import {
  Card, Title, Table, TableHead, TableHeaderCell, TableBody,
  TableRow, TableCell, Badge,
} from '@tremor/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Title>Productos con stock bajo</Title>
        <Badge color="amber">{total} productos</Badge>
      </div>
      {loading ? (
        <div className="h-40 bg-muted animate-pulse rounded" />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Producto</TableHeaderCell>
                <TableHeaderCell>SKU</TableHeaderCell>
                <TableHeaderCell>Almacén</TableHeaderCell>
                <TableHeaderCell className="text-right">Stock</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => (
                <TableRow key={`${item.product_variation_id}-${item.warehouse_id}`}>
                  <TableCell className="font-medium text-sm">{item.product_title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-sm">{item.warehouse_name}</TableCell>
                  <TableCell className="text-right">
                    <Badge color={item.stock === 0 ? 'red' : 'amber'} size="xs">
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
    </Card>
  );
}
