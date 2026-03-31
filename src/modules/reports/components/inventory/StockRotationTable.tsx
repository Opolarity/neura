import {
  Card, Title, Table, TableHead, TableHeaderCell, TableBody,
  TableRow, TableCell, Badge,
} from '@tremor/react';
import type { StockRotationItem } from '../../types/reports.types';

interface Props {
  data: StockRotationItem[];
  loading: boolean;
}

function RotationBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <Badge color="slate" size="xs">Sin stock</Badge>;
  if (rate >= 3) return <Badge color="emerald" size="xs">Alta ({rate}x)</Badge>;
  if (rate >= 1) return <Badge color="amber" size="xs">Media ({rate}x)</Badge>;
  return <Badge color="rose" size="xs">Baja ({rate}x)</Badge>;
}

export function StockRotationTable({ data, loading }: Props) {
  return (
    <Card>
      <Title className="mb-4">Análisis de rotación de inventario</Title>
      {loading ? (
        <div className="h-40 bg-muted animate-pulse rounded" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Producto</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell className="text-right">Unidades vendidas</TableHeaderCell>
              <TableHeaderCell className="text-right">Stock actual</TableHeaderCell>
              <TableHeaderCell className="text-center">Rotación</TableHeaderCell>
            </TableRow>
          </TableHead>
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
    </Card>
  );
}
