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
import { Wallet } from "lucide-react";
import { SupplierPaymentRow } from "../../types/supplierPayments.types";
import { ESTADO_PAGO } from "../../utils/supplierPaymentStatus";

interface SupplierPaymentsTableProps {
  rows: SupplierPaymentRow[];
  onPay: (row: SupplierPaymentRow) => void;
}

const cantidad = (value: number | null | undefined) =>
  value === null ? "—" : value.toLocaleString("es-PE", { maximumFractionDigits: 2 });

/**
 * Los servicios exigibles de UN taller, con de dónde sale cada importe: la
 * orden, cuándo se recibió, cuánto volvió de lo pedido y el precio vigente.
 * Qué se debe lo decide el backend (regla de personalizado: desde «En
 * proceso»); las prendas se muestran para reconocer el encargo, no entran en
 * la cuenta.
 */
const SupplierPaymentsTable = ({ rows, onPay }: SupplierPaymentsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>OP</TableHead>
        <TableHead>Cotización</TableHead>
        <TableHead>Servicio</TableHead>
        <TableHead>Recibido el</TableHead>
        <TableHead className="text-right">Prendas</TableHead>
        <TableHead className="text-right">Precio pactado</TableHead>
        <TableHead className="text-right">Pagado</TableHead>
        <TableHead className="text-right">Saldo</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="w-12" />
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
            Sin servicios con este filtro
          </TableCell>
        </TableRow>
      ) : (
        rows.map((row) => {
          const estado = ESTADO_PAGO[row.status];
          return (
            <TableRow key={row.serviceId}>
              <TableCell className="tabular-nums">{row.productionOrders ?? "—"}</TableCell>
              <TableCell className="tabular-nums">{row.quotationCode || "—"}</TableCell>
              <TableCell>
                <div className="font-medium">{row.serviceDescription || "—"}</div>
                {row.isMaterial && (
                  <div className="text-xs text-muted-foreground">Compra de material</div>
                )}
              </TableCell>
              <TableCell className="tabular-nums">
                {row.receivedOn ? formatDateDisplay(row.receivedOn) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {cantidad(row.goodQuantity)}
                {row.requestedQuantity != null && ` de ${cantidad(row.requestedQuantity)}`}
                {(row.badQuantity ?? 0) > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {cantidad(row.badQuantity)} falladas
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(row.payable)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(row.paid)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(row.balance)}
              </TableCell>
              <TableCell>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={row.balance <= 0}
                  onClick={() => onPay(row)}
                  title={row.balance > 0 ? "Registrar pago" : "Sin saldo pendiente"}
                  aria-label="Registrar pago"
                >
                  <Wallet className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
);

export default SupplierPaymentsTable;
