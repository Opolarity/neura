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
import type { ReturnsByReasonItem } from '../../types/reports.types';

interface Props {
  data: ReturnsByReasonItem[];
  loading: boolean;
}

/**
 * `returns.reason` lo escribe a mano quien registra el retorno, así que no hay
 * catálogo: el backend agrupa sin distinguir mayúsculas ni espacios sobrantes
 * y manda lo vacío a "Sin motivo". Aun así la lista puede ser larga, por eso
 * va en tabla con scroll y no en una torta.
 */
export function ReturnsByReasonTable({ data, loading }: Props) {
  return (
    <ReportCard
      title="Motivos de devolución"
      description="Texto libre del retorno, agrupado sin distinguir mayúsculas."
      contentClassName="max-h-64 overflow-y-auto"
    >
      {loading ? (
        <ChartLoading className="h-40" />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin retornos en el periodo</EmptyReportState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Retornos</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Reembolsado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.reason}>
                <TableCell className="font-medium text-sm">{item.reason}</TableCell>
                <TableCell className="text-right">{item.count.toLocaleString('es-PE')}</TableCell>
                <TableCell className="text-right">
                  {item.total_units_returned.toLocaleString('es-PE')}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.total_refund_amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportCard>
  );
}
