import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartLoading, EmptyReportState, ReportCard } from '../shared/ReportScaffold';
import { formatCurrency } from '@/shared/utils/currency';
import { returnTypeColor } from './returnTypeColors';
import type { ReturnsByTypeItem } from '../../types/reports.types';

interface Props {
  data: ReturnsByTypeItem[];
  loading: boolean;
}

/**
 * Reemplaza a la tabla de motivos (texto libre de `returns.reason`) a pedido
 * de Diego: solo los tres tipos del catálogo, con retornos, unidades y monto
 * reembolsado de cada uno, más una fila de total. Misma fuente que la dona.
 *
 * table-fixed: las cinco columnas se reparten el ancho de la tarjeta y el texto
 * envuelve, así el contenedor no necesita scroll horizontal.
 */
export function ReturnsByTypeTable({ data, loading }: Props) {
  const totals = data.reduce(
    (acc, d) => ({
      count: acc.count + d.count,
      units: acc.units + d.total_units_returned,
      refund: acc.refund + d.total_refund_amount,
    }),
    { count: 0, units: 0, refund: 0 },
  );

  return (
    <ReportCard
      info="Detalle por tipo de retorno del período: cuántos retornos hubo de cada tipo, cuántas unidades volvieron y cuánto se reembolsó. El monto es el neto de los movimientos de caja del retorno; los retornos sin movimiento registrado cuentan en la cantidad pero no en el monto."
      title="Detalle por tipo de devolución"
    >
      {loading ? (
        <ChartLoading className="h-40" />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin retornos en el periodo</EmptyReportState>
      ) : (
        <Table className="table-fixed" containerClassName="overflow-x-hidden">
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Retornos</TableHead>
              <TableHead className="text-right">Participación</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Reembolsado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, i) => (
              <TableRow key={item.return_type_id ?? item.return_type_name}>
                <TableCell className="font-medium text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: returnTypeColor(item.return_type_name, i) }}
                    />
                    {item.return_type_name}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{item.count.toLocaleString('es-PE')}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {totals.count > 0 ? `${((item.count / totals.count) * 100).toFixed(1)}%` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.total_units_returned.toLocaleString('es-PE')}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(item.total_refund_amount)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">{totals.count.toLocaleString('es-PE')}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">100%</TableCell>
              <TableCell className="text-right tabular-nums">{totals.units.toLocaleString('es-PE')}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.refund)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </ReportCard>
  );
}
