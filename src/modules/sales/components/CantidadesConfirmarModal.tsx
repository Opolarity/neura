import { useEffect, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { formatDateTime } from "@/shared/utils/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import {
  buildWhatsAppLink,
  CAUSE_LABEL,
  causesFor,
  confirmQuantityAdjustment,
  fetchQuantityAdjustments,
  type QuantityAdjustmentCause,
  type QuantityAdjustmentFilter,
  type QuantityAdjustmentRow,
} from "../services/PendingQuantityAdjustments.service";
import { toastError } from "@/shared/utils/toastError";

interface CantidadesConfirmarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama tras confirmar, para refrescar el contador de pendientes. */
  onChanged?: () => void;
}

const FILTERS: Array<{ value: QuantityAdjustmentFilter; label: string }> = [
  { value: "pending", label: "Por confirmar" },
  { value: "approved", label: "Confirmadas" },
  { value: "cancelled", label: "Anuladas" },
  { value: "all", label: "Todas" },
];

const EMPTY_MESSAGE: Record<QuantityAdjustmentFilter, string> = {
  all: "No hay diferencias de cantidad registradas.",
  pending: "No hay diferencias pendientes de confirmación.",
  approved: "Todavía no hay diferencias confirmadas.",
  cancelled: "No hay diferencias anuladas por recuento.",
};

const STATUS_LABEL: Record<QuantityAdjustmentRow["status"], string> = {
  pending: "Por confirmar",
  approved: "Confirmada",
  cancelled: "Anulada (recuento)",
};

const STATUS_VARIANT: Record<
  QuantityAdjustmentRow["status"],
  BadgeProps["variant"]
> = {
  pending: "warning",
  approved: "success",
  cancelled: "pending",
};

// Qué pasa con el stock según la causa, para que el proveedor lo sepa antes
// de confirmar.
const CAUSE_HINT: Record<QuantityAdjustmentCause, string> = {
  despacho_menos:
    "Las prendas no salieron del almacén: vuelven al stock.",
  despacho_mas:
    "Salieron más prendas de las marcadas: se descuentan del stock.",
  perdida_transporte:
    "Las prendas se perdieron en el camino: no vuelven al stock y quedan como pérdida.",
  otro: "Se corrige el stock con la diferencia. Explica el motivo en la nota.",
};

const daysLabel = (days: number) => (days === 1 ? "1 día" : `${days} días`);

export const CantidadesConfirmarModal = ({
  open,
  onOpenChange,
  onChanged,
}: CantidadesConfirmarModalProps) => {
  const { toast } = useToast();
  const [adjustments, setAdjustments] = useState<QuantityAdjustmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<QuantityAdjustmentFilter>("pending");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<QuantityAdjustmentRow | null>(null);
  const [cause, setCause] = useState<QuantityAdjustmentCause | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAdjustments = async () => {
    setLoading(true);
    try {
      const { rows, total: count } = await fetchQuantityAdjustments({
        status: filter,
        page,
        size,
      });
      setAdjustments(rows);
      setTotal(count);
    } catch (err) {
      console.error("Error cargando diferencias de cantidad:", err);
      toastError(err, "No se pudo cargar las diferencias de cantidad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadAdjustments();
  }, [open, filter, page, size]);

  const handleFilterChange = (value: QuantityAdjustmentFilter) => {
    if (value === filter) return;
    setPage(1);
    setFilter(value);
  };

  const openConfirm = (adjustment: QuantityAdjustmentRow) => {
    const options = causesFor(adjustment.sentQuantity, adjustment.receivedQuantity);
    setConfirming(adjustment);
    setCause(options[0]);
    setNote("");
  };

  const handleConfirm = async () => {
    if (!confirming || !cause) return;
    if (cause === "otro" && !note.trim()) {
      toast({
        title: "Falta la nota",
        description: "Con la causa \"Otro\" hay que explicar el motivo.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await confirmQuantityAdjustment(confirming.id, cause, note.trim() || null);
      toast({
        title: "Ajuste confirmado",
        description: `El pedido ${confirming.orderId} queda con ${confirming.receivedQuantity} unidades de ${confirming.sku}.`,
        variant: "success",
      });
      setConfirming(null);
      onChanged?.();
      await loadAdjustments();
    } catch (err) {
      console.error("Error confirmando la diferencia:", err);
      toastError(err, "No se pudo confirmar la diferencia.", "Error al confirmar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[1100px]">
          <DialogHeader>
            <DialogTitle>Cantidades por confirmar</DialogTitle>
            <DialogDescription>
              El franquiciado recibió una cantidad distinta a la enviada. Al
              confirmar, el pedido queda con la cantidad recibida y se registra
              la causa del error. Si no estás de acuerdo, contacta al
              franquiciado: la diferencia sigue abierta hasta que se confirme o
              él corrija su conteo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? "default" : "outline"}
                onClick={() => handleFilterChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando diferencias...
              </div>
            ) : adjustments.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">
                {EMPTY_MESSAGE[filter]}
              </p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
                <Table containerClassName="flex-1 min-h-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Franquiciado</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Prenda</TableHead>
                      <TableHead className="text-right">Enviado</TableHead>
                      <TableHead className="text-right">Recibido</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => {
                      const difference =
                        adjustment.receivedQuantity - adjustment.sentQuantity;
                      const whatsApp = buildWhatsAppLink(adjustment);

                      return (
                        <TableRow key={adjustment.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateTime(adjustment.createdAt)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {adjustment.franchiseName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {adjustment.orderId}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{adjustment.productName ?? "—"}</div>
                            <div className="text-muted-foreground">{adjustment.sku}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {adjustment.sentQuantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {adjustment.receivedQuantity}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {difference > 0 ? `+${difference}` : difference}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              <Badge variant={STATUS_VARIANT[adjustment.status]}>
                                {STATUS_LABEL[adjustment.status]}
                              </Badge>
                              {adjustment.status === "pending" && (
                                <span className="text-xs text-muted-foreground">
                                  Hace {daysLabel(adjustment.daysPending)}
                                </span>
                              )}
                              {adjustment.status === "approved" &&
                                adjustment.result?.cause && (
                                  <span className="text-xs text-muted-foreground">
                                    {CAUSE_LABEL[adjustment.result.cause]}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {adjustment.status === "pending" ? (
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openConfirm(adjustment)}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!whatsApp}
                                  title={
                                    whatsApp
                                      ? "Escribir al franquiciado por WhatsApp"
                                      : "El pedido no tiene teléfono registrado"
                                  }
                                  onClick={() =>
                                    whatsApp &&
                                    window.open(whatsApp, "_blank", "noopener,noreferrer")
                                  }
                                >
                                  <MessageCircle className="mr-1 h-4 w-4" />
                                  Contactar
                                </Button>
                              </div>
                            ) : (
                              <span className="whitespace-nowrap text-sm text-muted-foreground">
                                {adjustment.processedAt
                                  ? formatDateTime(adjustment.processedAt)
                                  : "—"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="border-t">
                  <PaginationBar
                    pagination={{ p_page: page, p_size: size, total }}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => {
                      setPage(1);
                      setSize(newSize);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirming !== null}
        onOpenChange={(value) => {
          if (!value && !saving) setConfirming(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Confirmar ajuste</DialogTitle>
            {confirming && (
              <DialogDescription>
                Pedido {confirming.orderId} · {confirming.productName ?? confirming.sku}:
                enviaste {confirming.sentQuantity} y el franquiciado recibió{" "}
                {confirming.receivedQuantity}. El pedido quedará con{" "}
                {confirming.receivedQuantity}.
              </DialogDescription>
            )}
          </DialogHeader>

          {confirming && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label required>¿Qué pasó?</Label>
                <RadioGroup
                  value={cause ?? undefined}
                  onValueChange={(value) => setCause(value as QuantityAdjustmentCause)}
                >
                  {causesFor(confirming.sentQuantity, confirming.receivedQuantity).map(
                    (option) => (
                      <div key={option} className="flex items-center gap-2">
                        <RadioGroupItem value={option} id={`cause-${option}`} />
                        <Label htmlFor={`cause-${option}`} className="font-normal">
                          {CAUSE_LABEL[option]}
                        </Label>
                      </div>
                    ),
                  )}
                </RadioGroup>
                {cause && (
                  <p className="text-sm text-muted-foreground">{CAUSE_HINT[cause]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment-note" required={cause === "otro"}>
                  Nota
                </Label>
                <Textarea
                  id="adjustment-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Detalle del error (opcional)"
                  required={cause === "otro"}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setConfirming(null)}
            >
              Cancelar
            </Button>
            <Button disabled={saving || !cause} onClick={handleConfirm}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                "Confirmar ajuste"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
