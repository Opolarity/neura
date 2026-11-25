import { Trash, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDateDisplay, formatTime, getTodayDate } from "@/shared/utils/date";
import { PAY_TYPE_LABELS, TimesheetDay, TimesheetEmployee, WEEKDAY_LABELS } from "../../types/attendance.types";
import { formatMinutes } from "../../utils/format";
import { paymentAmount } from "../../utils/timesheetStats";

/** Pagar o mandar a la bolsa: en un feriado la bolsa es REST; en horas extra, BANK. */
export type DayChoice = "PAY" | "BANK";

interface PaymentDetailDialogProps {
  detail: TimesheetEmployee | null;
  dateFrom: string | null;
  dateTo: string | null;
  /** Con attendance.manage: decidir el tiempo extra de cada día y usar horas de la bolsa. */
  canManage: boolean;
  saving: boolean;
  onClose: () => void;
  onSetChoice: (employee: TimesheetEmployee, day: TimesheetDay, choice: DayChoice) => void;
  onUseBank: (employee: TimesheetEmployee) => void;
  onDeleteUse: (restId: number) => void;
}

const weekday = (day: string) => {
  const d = new Date(`${day}T12:00:00`);
  return WEEKDAY_LABELS[d.getDay() === 0 ? 7 : d.getDay()].slice(0, 3);
};

/** «Por hora S/ 6.00», «Sueldo S/ 1,500.00/mes» o el tipo de pago solo. */
const pagoDe = (e: TimesheetEmployee) =>
  e.hourlyRate !== null
    ? `${PAY_TYPE_LABELS[e.payType]} ${formatCurrency(e.hourlyRate)}`
    : e.monthlySalary !== null
      ? `${PAY_TYPE_LABELS[e.payType]} ${formatCurrency(e.monthlySalary)}/mes`
      : PAY_TYPE_LABELS[e.payType] ?? e.payType;

/** La cuenta del monto, para rehacerla a mano, o «suma de cada día» si cambia por día. */
const cuenta = (e: TimesheetEmployee): string | null => {
  if (e.payType !== "HOURLY") return e.holidayPay ? "extra por feriado" : null;
  const tarifas = new Set(e.days.flatMap((d) => d.segments.map((s) => s.rate)).filter((r) => r !== null));
  const especial = e.days.some(
    (d) => (d.isHoliday && d.holidayMinutes > 0) || d.restMinutes > 0 || d.overtimeCompensation === "BANK",
  );
  const [tarifa] = [...tarifas];
  return tarifas.size === 1 && !especial && tarifa !== null
    ? `${e.workedMinutes} min × ${tarifa.toFixed(2)} ÷ 60`
    : "suma de cada día";
};

/** Una cifra del resumen de arriba. */
const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string | null }) => (
  <div className="rounded-lg border bg-background p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
  </div>
);

/** Feriado, falta, tarde, sin salida...: lo que hay que mirar de ese día. */
const DayBadge = ({ day }: { day: TimesheetDay }) => {
  const sinSalida = day.segments.some((s) => s.in && !s.out);
  if (day.isHoliday) return <Badge variant="info">Feriado</Badge>;
  if (day.isAbsent) return <Badge variant="destructive-soft">Falta</Badge>;
  if (sinSalida && day.day === getTodayDate()) return <Badge variant="info">En curso</Badge>;
  if (sinSalida) return <Badge variant="warning">Sin salida</Badge>;
  if (day.isIncomplete) return <Badge variant="warning">Incompleto</Badge>;
  if (day.lateMinutes > 0) return <Badge variant="warning">{day.lateMinutes} min tarde</Badge>;
  return null;
};

/** Minutos de tiempo extra del día (los del feriado también lo son) y su decisión. */
const extraDe = (d: TimesheetDay): { minutes: number; choice: DayChoice } | null => {
  if (d.isHoliday && d.compensation !== null && d.holidayMinutes > 0)
    return { minutes: d.holidayMinutes, choice: d.compensation === "PAY" ? "PAY" : "BANK" };
  if (d.overtimeCompensation !== null && d.overtimeMinutes > 0)
    return { minutes: d.overtimeMinutes, choice: d.overtimeCompensation === "PAY" ? "PAY" : "BANK" };
  return null;
};

/**
 * Pop-up de un trabajador en Pagos (botón «Editar» de la fila): arriba sus
 * cifras (horas, monto, horas extra y bolsa de horas) y abajo cada día en
 * columnas: marcas, horas, horas extra (las que pasan su jornada y las del
 * feriado), qué se hace con ellas (pagar o a la bolsa) o las horas que usó de
 * la bolsa, y el monto.
 */
export const PaymentDetailDialog = ({
  detail,
  dateFrom,
  dateTo,
  canManage,
  saving,
  onClose,
  onSetChoice,
  onUseBank,
  onDeleteUse,
}: PaymentDetailDialogProps) => {
  const monto = detail ? paymentAmount(detail) : null;
  const dias =
    detail?.days.filter((d) => d.segments.length > 0 || d.isAbsent || d.isHoliday || d.restMinutes > 0) ?? [];
  const extra = detail ? detail.overtimePaidMinutes + detail.overtimeBankMinutes + detail.holidayMinutes : 0;
  const pagadas = detail ? detail.overtimePaidMinutes + detail.holidayExtraMinutes : 0;

  return (
    <Dialog open={detail !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-4 overflow-hidden">
        {detail && (
          <>
            <DialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pr-8 text-left">
              <div className="space-y-1">
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>
                  {detail.code} · {pagoDe(detail)}
                  {dateFrom && dateTo ? ` · ${formatDateDisplay(dateFrom)} – ${formatDateDisplay(dateTo)}` : ""}
                </DialogDescription>
              </div>
              {canManage && detail.restBalanceMinutes > 0 && (
                <Button size="sm" className="gap-1.5 shrink-0" onClick={() => onUseBank(detail)}>
                  <Wallet className="w-4 h-4" />
                  Usar horas de la bolsa
                </Button>
              )}
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Horas trabajadas" value={formatMinutes(detail.workedMinutes)} hint={`${detail.workedMinutes} min`} />
              <Stat label="Monto" value={monto !== null ? formatCurrency(monto) : "—"} hint={cuenta(detail)} />
              <Stat
                label="Horas extra"
                value={formatMinutes(extra)}
                hint={
                  [
                    pagadas > 0 && `${formatMinutes(pagadas)} pagadas`,
                    detail.bankEarnedMinutes > 0 && `${formatMinutes(detail.bankEarnedMinutes)} a la bolsa`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "con feriados"
                }
              />
              <Stat
                label="Bolsa de horas"
                value={formatMinutes(detail.restBalanceMinutes)}
                hint={detail.restTakenMinutes > 0 ? `usó ${formatMinutes(detail.restTakenMinutes)} en el rango` : "saldo de hoy"}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
              <Table containerClassName="max-h-[50vh]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Día</TableHead>
                    <TableHead>Marcas</TableHead>
                    <TableHead className="w-[90px] text-right">Horas</TableHead>
                    <TableHead className="w-[100px] text-right">Horas extra</TableHead>
                    <TableHead className="w-[200px]">Pago o bolsa</TableHead>
                    <TableHead className="w-[100px] text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Sin marcas en este rango
                      </TableCell>
                    </TableRow>
                  ) : (
                    dias.map((d) => {
                      const x = extraDe(d);
                      return (
                        <TableRow key={d.day}>
                          <TableCell>
                            <div className="font-medium whitespace-nowrap">
                              {weekday(d.day)} {formatDateDisplay(d.day).slice(0, 5)}
                            </div>
                            <div className="mt-1">
                              <DayBadge day={d} />
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {d.segments.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="space-y-0.5">
                                {d.segments.map((s, i) => (
                                  <div key={i} className="whitespace-nowrap">
                                    {s.in ? formatTime(s.in) : "—"} → {s.out ? formatTime(s.out) : "—"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                            {formatMinutes(d.workedMinutes)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {x ? formatMinutes(x.minutes) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {x &&
                                (canManage ? (
                                  <Select
                                    value={x.choice}
                                    disabled={saving}
                                    onValueChange={(v) => onSetChoice(detail, d, v as DayChoice)}
                                  >
                                    <SelectTrigger className="h-8 w-full" aria-label="Qué se hace con estas horas extra">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PAY">{d.isHoliday ? "Pagar doble" : "Pagar"}</SelectItem>
                                      <SelectItem value="BANK">A la bolsa</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span>{x.choice === "PAY" ? (d.isHoliday ? "Se pagan doble" : "Se pagan") : "A la bolsa"}</span>
                                ))}
                              {d.restMinutes > 0 && (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <Badge variant="success">
                                      Usó {d.restFullDay ? "el día" : formatMinutes(d.restMinutes)}
                                    </Badge>
                                    {d.restNote && (
                                      <div className="mt-1 truncate text-xs text-muted-foreground" title={d.restNote}>
                                        {d.restNote}
                                      </div>
                                    )}
                                  </div>
                                  {canManage && d.restId !== null && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      title="Quitar: las horas vuelven a la bolsa"
                                      disabled={saving}
                                      onClick={() => d.restId !== null && onDeleteUse(d.restId)}
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              {!x && d.restMinutes === 0 && <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {monto !== null && d.hourlyRate !== null ? formatCurrency(d.amount) : ""}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
