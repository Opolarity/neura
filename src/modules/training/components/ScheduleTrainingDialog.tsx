import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/modules/auth";
import { useToast } from "@/components/ui/use-toast";
import { useTrainingHosts } from "../hooks/useTrainingHosts";
import { useTrainingSlots } from "../hooks/useTrainingSlots";
import { createTrainingBooking } from "../services/Training.service";
import { TrainingServiceError, MAX_NOTES_LENGTH } from "../types/Training.types";
import { TrainingSlotPicker } from "./TrainingSlotPicker";

interface ScheduleTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled: () => void;
}

export const ScheduleTrainingDialog = ({
  open,
  onOpenChange,
  onScheduled,
}: ScheduleTrainingDialogProps) => {
  const { appUser } = useAuth();
  const { toast } = useToast();

  const [slug, setSlug] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const hosts = useTrainingHosts(open);
  const slots = useTrainingSlots(open ? slug : null);

  // Al cerrar se limpia todo: reabrir el diálogo con el horario de la vez
  // anterior ya seleccionado invita a confirmar un hueco que quizá ya no existe.
  useEffect(() => {
    if (!open) {
      setSlug(null);
      setSelectedSlot(null);
      setNotes("");
    }
  }, [open]);

  // Cambiar de capacitador invalida el horario elegido: los slots son suyos.
  useEffect(() => {
    setSelectedSlot(null);
  }, [slug]);

  const host = hosts.hosts.find((h) => h.slug === slug) ?? null;

  const handleSubmit = async () => {
    if (!slug || !selectedSlot) return;

    setSending(true);
    try {
      await createTrainingBooking({
        slug,
        start: selectedSlot,
        inviteeName: appUser?.accountName?.trim() || "Usuario del ERP",
        notes: notes.trim() || undefined,
      });
      toast({
        title: "Capacitación agendada",
        description: "Te llegará la invitación al correo con el que entras al ERP.",
      });
      onScheduled();
      onOpenChange(false);
    } catch (error) {
      const isSlotTaken =
        error instanceof TrainingServiceError && error.code === "slot_taken";
      toast({
        variant: "destructive",
        title: isSlotTaken ? "Ese horario acaba de ocuparse" : "No se pudo agendar",
        description:
          error instanceof TrainingServiceError
            ? error.message
            : "Intenta nuevamente en unos minutos.",
      });
      // El horario dejó de estar libre: se recarga la rejilla y se suelta la
      // selección para que el usuario elija sobre datos vigentes.
      if (isSlotTaken) {
        setSelectedSlot(null);
        slots.reload();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar capacitación</DialogTitle>
          <DialogDescription>
            Elige un capacitador y un horario disponible. La invitación llega al
            correo con el que entras al ERP.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="training-host">Capacitador</Label>
            {hosts.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando capacitadores...
              </div>
            ) : hosts.error ? (
              <p className="text-sm text-muted-foreground">{hosts.error}</p>
            ) : hosts.hosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ahora mismo no hay capacitadores disponibles. Intenta más tarde.
              </p>
            ) : (
              <Select value={slug ?? ""} onValueChange={setSlug}>
                <SelectTrigger id="training-host">
                  <SelectValue placeholder="Elige un capacitador" />
                </SelectTrigger>
                <SelectContent>
                  {hosts.hosts.map((option) => (
                    <SelectItem key={option.slug} value={option.slug}>
                      {option.hostName}
                      {option.hostJobTitle ? ` — ${option.hostJobTitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {host && (
              <p className="text-xs text-muted-foreground">
                {host.title} · {host.durationMinutes} minutos
                {host.hasTeams ? " · con enlace de Teams" : ""}
              </p>
            )}
          </div>

          {slug && (
            <div className="space-y-2">
              <Label>Horario</Label>
              <TrainingSlotPicker
                slots={slots.slots}
                loading={slots.loading}
                error={slots.error}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
                onReload={slots.reload}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="training-notes">¿Qué quieres ver? (opcional)</Label>
            <Textarea
              id="training-notes"
              value={notes}
              maxLength={MAX_NOTES_LENGTH}
              rows={3}
              placeholder="Temas o dudas concretas para aprovechar la sesión"
              onChange={(event) => setNotes(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length} / {MAX_NOTES_LENGTH}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!slug || !selectedSlot || sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
