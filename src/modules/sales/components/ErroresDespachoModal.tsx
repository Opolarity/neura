import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter, type DateRangeValue } from "@/shared/components/date-range";
import { formatCurrency } from "@/shared/utils/currency";
import {
  addCalendarDays,
  formatDateDisplay,
  formatDateTime,
  getTodayDate,
} from "@/shared/utils/date";
import { toastError } from "@/shared/utils/toastError";
import {
  CAUSE_LABEL,
  fetchDispatchErrors,
  type DispatchErrorsReport,
} from "../services/PendingQuantityAdjustments.service";

interface ErroresDespachoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "YYYY-MM-DD" del primer día del mes → "septiembre 2026", sin pasar por Date.
const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-");
  return `${MONTHS[Number(monthNumber) - 1] ?? month} ${year}`;
};

const EMPTY_REPORT: DispatchErrorsReport = { summary: [], details: [], recounts: [] };

export const ErroresDespachoModal = ({ open, onOpenChange }: ErroresDespachoModalProps) => {
  const [range, setRange] = useState<DateRangeValue>(() => ({
    startDate: addCalendarDays(getTodayDate(), -90),
    endDate: getTodayDate(),
  }));
  const [report, setReport] = useState<DispatchErrorsReport>(EMPTY_REPORT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    fetchDispatchErrors(range.startDate, range.endDate)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        console.error("Error cargando errores de despacho:", err);
        toastError(err, "No se pudo cargar el reporte de errores de despacho.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, range.startDate, range.endDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle>Errores de despacho</DialogTitle>
          <DialogDescription>
            Diferencias de cantidad confirmadas en envíos a franquiciados, por
            fecha de despacho y por quien despachó.
          </DialogDescription>
        </DialogHeader>

        <DateRangeFilter
          startDate={range.startDate}
          endDate={range.endDate}
          onChange={setRange}
          layout="inline"
        />

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando reporte...
          </div>
        ) : (
          <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="details">Detalle ({report.details.length})</TabsTrigger>
              <TabsTrigger value="recounts">
                Recuentos del franquiciado ({report.recounts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="min-h-0 flex-1">
              {report.summary.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  No hay errores de despacho en este período.
                </p>
              ) : (
                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border">
                  <Table containerClassName="flex-1 min-h-0">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead>Despachó</TableHead>
                        <TableHead className="text-right">Errores</TableHead>
                        <TableHead className="text-right">Unidades</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Líneas despachadas</TableHead>
                        <TableHead className="text-right">% con error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.summary.map((row) => (
                        <TableRow key={`${row.month}-${row.dispatched_by ?? "sin"}`}>
                          <TableCell className="capitalize">{monthLabel(row.month)}</TableCell>
                          <TableCell className="font-medium">{row.dispatched_by_name}</TableCell>
                          <TableCell className="text-right">{row.cases}</TableCell>
                          <TableCell className="text-right">{row.units}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                          <TableCell className="text-right">{row.lines_dispatched ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {row.error_rate === null ? "—" : `${row.error_rate}%`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="min-h-0 flex-1">
              {report.details.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  No hay errores de despacho en este período.
                </p>
              ) : (
                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border">
                  <Table containerClassName="flex-1 min-h-0">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Despacho</TableHead>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Franquiciado</TableHead>
                        <TableHead>Prenda</TableHead>
                        <TableHead className="text-right">Enviado</TableHead>
                        <TableHead className="text-right">Recibido</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Causa</TableHead>
                        <TableHead>Responsables</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.details.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateTime(row.dispatched_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.order_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.tenant_reference ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{row.product_name ?? "—"}</div>
                            <div className="text-muted-foreground">{row.sku}</div>
                          </TableCell>
                          <TableCell className="text-right">{row.sent_quantity}</TableCell>
                          <TableCell className="text-right">{row.received_quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Math.abs(row.amount))}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{CAUSE_LABEL[row.cause] ?? row.cause}</div>
                            {row.note && (
                              <div className="text-muted-foreground">{row.note}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>Despachó: {row.dispatched_by_name ?? "—"}</div>
                            <div className="text-muted-foreground">
                              Armó: {row.prepared_by_name ?? "—"}
                            </div>
                            <div className="text-muted-foreground">
                              Confirmó: {row.confirmed_by_name ?? "—"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recounts" className="min-h-0 flex-1">
              {report.recounts.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  Ningún franquiciado corrigió su conteo en este período.
                </p>
              ) : (
                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border">
                  <Table containerClassName="flex-1 min-h-0">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Franquiciado</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Enviado</TableHead>
                        <TableHead className="text-right">Reportó</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.recounts.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateDisplay(row.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.order_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.tenant_reference ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">{row.sku}</TableCell>
                          <TableCell className="text-right">{row.sent_quantity}</TableCell>
                          <TableCell className="text-right">{row.reported_quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
