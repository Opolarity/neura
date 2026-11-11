import { Eye, Loader2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateDisplay } from "@/shared/utils/date";
import { SupplierPayableRow } from "../../types/supplierPayments.types";
import { ESTADO_PAGO } from "../../utils/supplierPaymentStatus";

interface SupplierPayablesTableProps {
  rows: SupplierPayableRow[];
  loading: boolean;
  onPay: (row: SupplierPayableRow) => void;
  onView: (row: SupplierPayableRow) => void;
}

const COLUMNAS = 5;

/**
 * Lo que se le debe a cada taller, por OP (2026-10-19): una fila por taller y
 * OP con el total por pagar. «Pagar» salda esa OP; el ojo abre el detalle de
 * los servicios que se le deben.
 */
const SupplierPayablesTable = ({ rows, loading, onPay, onView }: SupplierPayablesTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Taller / proveedor</TableHead>
        <TableHead>OP</TableHead>
        <TableHead className="text-right">Total por pagar</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="w-44">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading && rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={COLUMNAS} className="py-8 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </TableCell>
        </TableRow>
      ) : rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={COLUMNAS} className="py-8 text-center text-muted-foreground">
            No hay nada por pagar con estos filtros
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => {
          const estado = ESTADO_PAGO[row.status];
          return (
            <TableRow key={`${row.supplierId ?? "sin"}-${row.productionOrderId ?? "sin"}`}>
              <TableCell>
                <div className="font-medium">{row.supplierName}</div>
                {row.oldestPendingOn && (
                  <div className="text-xs text-muted-foreground">
                    Pendiente desde {formatDateDisplay(row.oldestPendingOn)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium tabular-nums">{row.productionOrderCode ?? "Sin OP"}</div>
                {row.productionOrderName && (
                  <div className="max-w-[260px] truncate text-xs text-muted-foreground" title={row.productionOrderName}>
                    {row.productionOrderName}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatCurrency(row.balance)}</TableCell>
              <TableCell>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={row.balance <= 0}
                    onClick={() => onPay(row)}
                    title="Pagar todo lo que se le debe en esta OP"
                  >
                    <Wallet className="h-4 w-4" />
                    Pagar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onView(row)}
                    title="Ver los servicios que se le deben"
                    aria-label={`Ver los servicios de ${row.supplierName} en ${row.productionOrderCode ?? "sin OP"}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
);

export default SupplierPayablesTable;
