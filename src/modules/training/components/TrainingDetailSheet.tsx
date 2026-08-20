import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Video, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useTrainingSlots } from "../hooks/useTrainingSlots";
import {
  cancelTrainingBooking,
  rescheduleTrainingBooking,
} from "../services/Training.service";
import { TrainingServiceError, type TrainingBooking } from "../types/Training.types";
import { formatTrainingDate, formatTrainingTime } from "../utils/formatTraining";
import { TrainingSlotPicker } from "./TrainingSlotPicker";
import { TrainingStatusBadge } from "./TrainingStatusBadge";

interface TrainingDetailSheetProps {
  booking: TrainingBooking | null;
  onClose: () => void;
  /** Se llama tras cancelar o reprogramar, para refrescar el listado. */
  onChanged: () => void;
}

type Mode = "view" | "reschedule" | "cancel";

export const TrainingDetailSheet = ({
  booking,
  onClose,
  onChanged,
}: TrainingDetailSheetProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("view");
  const [newStart, setNewStart] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  // Los horarios solo se piden al entrar en modo reprogramar: cada consulta
  // cuesta una llamada al calendario del capacitador.
  const slots = useTrainingSlots(
    mode === "reschedule" && booking?.hostSlug ? booking.hostSlug : null,
  );

  useEffect(() => {
    setMode("view");
    setNewStart(null);
    setReason("");
  }, [booking?.id]);

  if (!booking) return null;

  // Solo se puede tocar una capacitación agendada que todavía no empezó; es la
  // misma regla que aplica OPOLARITY, replicada aquí para no ofrecer un botón
  // que va a fallar.
  const isActionable = booking.status === "confirmed" && !booking.isPast;

  const runCancel = async () => {
    setWorking(true);
    try {
      await cancelTrainingBooking(booking.id, reason.trim() || undefined);
      toast({ title: "Capacitación cancelada" });
      onChanged();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo cancelar",
        description:
          error instanceof TrainingServiceError
            ? error.message
            : "Intenta nuevamente en unos minutos.",
      });
    } finally {
      setWorking(false);
    }
  };

  const runReschedule = async () => {
    if (!newStart) return;
    setWorking(true);
    try {
      await rescheduleTrainingBooking(booking.id, newStart);
      toast({ title: "Capacitación reprogramada" });
      onChanged();
      onClose();
    } catch (error) {
      const isSlotTaken =
        error instanceof TrainingServiceError && error.code === "slot_taken";
      toast({
        variant: "destructive",
        title: isSlotTaken ? "Ese horario acaba de ocuparse" : "No se pudo reprogramar",
        description:
          error instanceof TrainingServiceError
            ? error.message
            : "Intenta nuevamente en unos minutos.",
      });
      if (isSlotTaken) {
        setNewStart(null);
        slots.reload();
      }
    } finally {
      setWorking(false);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{booking.title}</SheetTitle>
          <SheetDescription>
            Con {booking.hostName}
            {booking.hostJobTitle ? ` · ${booking.hostJobTitle}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{formatTrainingDate(booking.startsAt)}</p>
              <p className="text-sm text-muted-foreground">
                {formatTrainingTime(booking.startsAt)} – {formatTrainingTime(booking.endsAt)}
              </p>
            </div>
            <TrainingStatusBadge booking={booking} />
          </div>

          {booking.meetingUrl && booking.status === "confirmed" && (
            <Button asChild variant="outline" className="w-full">
              <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer">
                <Video className="w-4 h-4 mr-2" />
                Unirse a la reunión
              </a>
            </Button>
          )}

          {booking.notes && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Temas a tratar</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {booking.notes}
              </p>
            </div>
          )}

          {booking.cancelReason && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Motivo de la cancelación</p>
              <p className="text-sm text-muted-foreground">{booking.cancelReason}</p>
            </div>
          )}

          {isActionable && (
            <>
              <Separator />

              {mode === "view" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMode("reschedule")}
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Reprogramar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMode("cancel")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}

              {mode === "reschedule" && (
                <div className="space-y-3">
                  <Label>Nuevo horario</Label>
                  {/* El hueco que ocupa ahora esta misma capacitación vuelve a
                      aparecer libre: OPOLARITY la excluye de la rejilla a
                      propósito, para poder moverla media hora. */}
                  <TrainingSlotPicker
                    slots={slots.slots}
                    loading={slots.loading}
                    error={slots.error}
                    selected={newStart}
                    onSelect={setNewStart}
                    onReload={slots.reload}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setMode("view")}
                      disabled={working}
                    >
                      Volver
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={runReschedule}
                      disabled={!newStart || working}
                    >
                      {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar cambio
                    </Button>
                  </div>
                </div>
              )}

              {mode === "cancel" && (
                <div className="space-y-3">
                  <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
                  <Textarea
                    id="cancel-reason"
                    value={reason}
                    maxLength={500}
                    rows={3}
                    placeholder="Nos ayuda a reprogramarla mejor"
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setMode("view")}
                      disabled={working}
                    >
                      Volver
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={runCancel}
                      disabled={working}
                    >
                      {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancelar capacitación
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
