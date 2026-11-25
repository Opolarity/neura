import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { KIND_LABELS, PAY_TYPE_LABELS, TimesheetEmployee } from "../../types/attendance.types";
import { formatMinutes } from "../../utils/format";
import { paymentAmount } from "../../utils/timesheetStats";
import { Dash, EmptyRow, LoadingRow } from "../TableStates";

interface PaymentsTableProps {
  items: TimesheetEmployee[];
  loading: boolean;
  /** Abre el pop-up para ver y editar sus pagos y su bolsa de horas. */
  onEdit: (employee: TimesheetEmployee) => void;
}

const Minutes = ({ value }: { value: number }) => (value > 0 ? <>{formatMinutes(value)}</> : <Dash />);

/**
 * Pagos por trabajador en el rango: horas, horas extra (las que pasan su
 * jornada y las trabajadas en feriado; cuántas fueron a la bolsa), su bolsa de
 * horas y el monto. «Editar» abre su detalle.
 */
export const PaymentsTable = ({ items, loading, onEdit }: PaymentsTableProps) => {
  const colSpan = 7;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trabajador</TableHead>
          <TableHead>Pago</TableHead>
          <TableHead className="text-right">Horas</TableHead>
          <TableHead className="text-right">Horas extra</TableHead>
          <TableHead className="text-right">Bolsa de horas</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <LoadingRow colSpan={colSpan} label="Calculando pagos..." />
        ) : items.length === 0 ? (
          <EmptyRow colSpan={colSpan} label="No hay marcas ni horarios en este rango" />
        ) : (
          items.map((e) => {
            const monto = paymentAmount(e);
            // El feriado trabajado también es tiempo extra.
            const extra = e.overtimePaidMinutes + e.overtimeBankMinutes + e.holidayMinutes;
            return (
              <TableRow key={e.employeeId}>
                <TableCell>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.code} · {KIND_LABELS[e.kind]}
                  </div>
                </TableCell>
                <TableCell>
                  {PAY_TYPE_LABELS[e.payType] ?? e.payType}
                  <div className="text-xs text-muted-foreground">
                    {e.hourlyRate !== null
                      ? `${formatCurrency(e.hourlyRate)}/h`
                      : e.monthlySalary !== null
                        ? `${formatCurrency(e.monthlySalary)}/mes`
                        : null}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap font-medium">
                  {formatMinutes(e.workedMinutes)}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  <Minutes value={extra} />
                  {e.bankEarnedMinutes > 0 && (
                    <div className="text-xs text-muted-foreground">{formatMinutes(e.bankEarnedMinutes)} a la bolsa</div>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {e.restBalanceMinutes !== 0 ? (
                    <span className="font-medium">{formatMinutes(e.restBalanceMinutes)}</span>
                  ) : (
                    <Dash />
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {monto !== null ? (
                    <>
                      <div className="font-medium">{formatCurrency(monto)}</div>
                      {e.payType !== "HOURLY" && <div className="text-xs text-muted-foreground">extra feriado</div>}
                    </>
                  ) : (
                    <Dash />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" title="Editar pagos y bolsa de horas" onClick={() => onEdit(e)}>
                      <SquarePen className="w-4 h-4" />
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
};
