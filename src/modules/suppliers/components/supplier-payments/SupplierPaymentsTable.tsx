import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { Loader2, Wallet } from "lucide-react";
import {
  SupplierPaymentRow,
  SupplierPaymentStatus,
} from "../../types/supplierPayments.types";

interface SupplierPaymentsTableProps {
  rows: SupplierPaymentRow[];
  loading: boolean;
  onPay: (row: SupplierPaymentRow) => void;
  /** Los servicios marcados para saldar juntos. */
  selectedIds: number[];
  /** Si están marcados todos los que se pueden marcar. */
  allSelected: boolean;
  onToggleRow: (serviceId: number, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}

const ESTADO: Record<
  SupplierPaymentStatus,
  { label: string; variant: "destructive-soft" | "warning" | "success" }
> = {
  PENDING: { label: "Pendiente", variant: "destructive-soft" },
  PARTIAL: { label: "Parcial", variant: "warning" },
  PAID: { label: "Pagado", variant: "success" },
};

const SupplierPaymentsTable = ({
  rows,
  loading,
  onPay,
  selectedIds,
  allSelected,
  onToggleRow,
  onToggleAll,
}: SupplierPaymentsTableProps) => {
  // Marcar todo marca lo PAGABLE, no todo lo que se ve: incluir un servicio
  // saldado solo serviría para que el backend rechazara el lote entero.
  const hayPagables = rows.some((row) => row.balance > 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              disabled={!hayPagables}
              onCheckedChange={(value) => onToggleAll(value === true)}
              aria-label="Marcar todo lo pendiente de esta página"
            />
          </TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Cotización</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">Pagado</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-16">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando pagos...
              </div>
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="text-center py-8 text-muted-foreground"
            >
              No hay nada por pagar con estos filtros
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const estado = ESTADO[row.status] ?? ESTADO.PENDING;

            return (
              <TableRow key={row.serviceId}>
                <TableCell className="w-10">
                  {/* Un servicio saldado no se marca: en el lote solo serviría
                      para que el backend lo rechazara y tumbara el resto. */}
                  <Checkbox
                    checked={selectedIds.includes(row.serviceId)}
                    disabled={row.balance <= 0}
                    onCheckedChange={(value) =>
                      onToggleRow(row.serviceId, value === true)
                    }
                    aria-label={`Marcar ${row.serviceDescription || `servicio #${row.serviceId}`}`}
                  />
                </TableCell>

                <TableCell className="font-medium text-sm">
                  {row.supplierName}
                </TableCell>

                <TableCell className="text-sm">
                  {row.serviceDescription || `Servicio #${row.serviceId}`}
                  {row.serviceCode && (
                    <span className="block text-xs text-muted-foreground">
                      {row.serviceCode}
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {row.quotationCode || `#${row.quotationId}`}
                </TableCell>

                <TableCell className="text-right text-sm tabular-nums">
                  {formatCurrency(row.payable)}
                </TableCell>

                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {formatCurrency(row.paid)}
                </TableCell>

                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(row.balance)}
                </TableCell>

                <TableCell>
                  <Badge variant={estado.variant}>{estado.label}</Badge>
                </TableCell>

                <TableCell>
                  {/* Un servicio saldado no se puede volver a pagar: el SP lo
                      rechaza, y ofrecer el botón sería llevar a un error. */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={row.balance <= 0}
                    onClick={() => onPay(row)}
                    title={
                      row.balance <= 0 ? "Sin saldo pendiente" : "Registrar pago"
                    }
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="sr-only">Registrar pago</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

export default SupplierPaymentsTable;
