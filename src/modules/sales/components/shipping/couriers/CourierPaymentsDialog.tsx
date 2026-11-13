import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DateRangeFilter, type DateRangeValue } from "@/shared/components/date-range";
import { formatDateTime, getTodayDate } from "@/shared/utils/date";
import { useCourierPayments } from "../../../hooks/useCourierPayments";
import {
  COURIER_NAMES,
  type CourierCode,
  type CourierGuidePayment,
} from "../../../types/Couriers.types";
import { formatSoles } from "../../../utils/couriers";

const STATUS_BADGE: Record<CourierGuidePayment["status"], { label: string; variant: "success" | "warning" | "pending" }> = {
  paid: { label: "Pagado", variant: "success" },
  pending: { label: "Pendiente", variant: "warning" },
  customer: { label: "Paga el destinatario", variant: "pending" },
};

interface CourierPaymentsDialogProps {
  courier: CourierCode | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Pagos de las guías de un courier por rango de días: Olva se paga guía por
 * guía con su link de PagoEfectivo; las dos se pueden marcar como pagadas a
 * mano (por ejemplo, si se pagó en la agencia).
 */
export function CourierPaymentsDialog({ courier, onOpenChange }: CourierPaymentsDialogProps) {
  const today = getTodayDate();
  const [range, setRange] = useState<DateRangeValue>({ startDate: today, endDate: today });
  const [selected, setSelected] = useState<number[]>([]);
  const {
    data,
    isLoading,
    error,
    refetch,
    markPaid,
    isMarking,
    openPaymentLink,
    payingOrderId,
  } = useCourierPayments(courier, range.startDate, range.endDate ?? range.startDate);

  // Al abrir otro courier o cambiar el rango, se limpia la selección.
  useEffect(() => setSelected([]), [courier, range.startDate, range.endDate, data]);

  const guides = useMemo(() => data?.guides ?? [], [data]);
  const selectable = guides.filter((g) => g.status === "pending");
  const selectedGuides = guides.filter((g) => selected.includes(g.orderId));
  const selectedPending = selectedGuides.filter((g) => g.status === "pending");
  const allSelected = selectable.length > 0 && selectable.every((g) => selected.includes(g.orderId));

  const toggle = (orderId: number, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)));

  return (
    <Dialog open={courier !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Pagos de guías · {courier ? COURIER_NAMES[courier] : ""}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <DateRangeFilter
            startDate={range.startDate}
            endDate={range.endDate}
            onChange={setRange}
            showPresets
            layout="inline"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {selectedPending.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isMarking}
              onClick={() => markPaid(selectedPending.map((g) => g.orderId))}
            >
              {isMarking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar {selectedPending.length} como pagadas
            </Button>
          </div>
        )}

        <div className="max-h-[50vh] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) =>
                      setSelected(checked === true ? selectable.map((g) => g.orderId) : [])
                    }
                    aria-label="Seleccionar todas"
                    disabled={selectable.length === 0}
                  />
                </TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Guía</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !data ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-destructive">
                    {error instanceof Error ? error.message : "No se pudieron cargar las guías"}
                  </TableCell>
                </TableRow>
              ) : guides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No hay guías en estas fechas.
                  </TableCell>
                </TableRow>
              ) : (
                guides.map((guide) => {
                  const badge = STATUS_BADGE[guide.status];
                  return (
                    <TableRow key={guide.orderId}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(guide.orderId)}
                          onCheckedChange={(checked) => toggle(guide.orderId, checked === true)}
                          disabled={guide.status !== "pending"}
                          aria-label={`Seleccionar guía ${guide.trackingNumber}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateTime(guide.createdAt)}</TableCell>
                      <TableCell>{guide.orderCode || `#${guide.orderId}`}</TableCell>
                      <TableCell>{guide.customer ?? "—"}</TableCell>
                      <TableCell className="font-medium">{guide.trackingNumber}</TableCell>
                      <TableCell>{guide.destination ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {guide.cost != null ? formatSoles(guide.cost) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {guide.status === "paid" && guide.paidByCourier && (
                            <span className="text-xs text-muted-foreground">Confirmado por Olva</span>
                          )}
                          {guide.stateError && (
                            <span className="text-xs text-muted-foreground">Olva no respondió</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {guide.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            {courier === "OWN-OLVA" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentLink(guide.orderId)}
                                disabled={payingOrderId === guide.orderId}
                              >
                                {payingOrderId === guide.orderId ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                )}
                                Pagar
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => markPaid([guide.orderId])}
                              disabled={isMarking}
                            >
                              Marcar pagado
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
