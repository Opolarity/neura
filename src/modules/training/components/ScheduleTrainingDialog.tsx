import { useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useUserProfile } from "@/modules/auth";
import { useToast } from "@/components/ui/use-toast";
import { useTrainingHosts } from "../hooks/useTrainingHosts";
import { useTrainingSlots } from "../hooks/useTrainingSlots";
import { createTrainingBooking } from "../services/Training.service";
import { TrainingServiceError, MAX_NOTES_LENGTH } from "../types/Training.types";
import {
  buildRequesterName,
  isValidPhone,
  normalizePhone,
  MAX_REQUESTER_NAME_LENGTH,
  MIN_REQUESTER_NAME_LENGTH,
} from "../utils/requester";
import { TrainingSlotPicker } from "./TrainingSlotPicker";
import { toastError } from "@/shared/utils/toastError";

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
  const { user, appUser } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { toast } = useToast();

  const [slug, setSlug] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [inviteeName, setInviteeName] = useState("");
  const [inviteePhone, setInviteePhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  // El perfil llega asíncrono: sin estos dos candados, cada re-render con datos
  // nuevos pisaría un nombre corregido a mano o un teléfono borrado a propósito.
  // `prefilled` limita el prellenado a una vez por apertura; `touched` protege
  // lo que el usuario ya escribió mientras el perfil venía en camino.
  const prefilledRef = useRef(false);
  const touchedRef = useRef({ name: false, phone: false });

  const hosts = useTrainingHosts(open);
  const slots = useTrainingSlots(open ? slug : null);

  // Al cerrar se limpia todo: reabrir el diálogo con el horario de la vez
  // anterior ya seleccionado invita a confirmar un hueco que quizá ya no existe.
  useEffect(() => {
    if (!open) {
      setSlug(null);
      setSelectedSlot(null);
      setInviteeName("");
      setInviteePhone("");
      setNotes("");
      prefilledRef.current = false;
      touchedRef.current = { name: false, phone: false };
    }
  }, [open]);

  // Prellenado del solicitante. Se espera a que la consulta del perfil se
  // resuelva (con o sin fila) para escribir una sola vez: el nombre sale de
  // `accounts`, con el claim del JWT y el correo como red de seguridad, y el
  // celular de `profiles.phone`, que es bigint y por eso pasa por
  // `normalizePhone` en vez de usarse tal cual.
  useEffect(() => {
    if (!open || profileLoading || prefilledRef.current) return;
    prefilledRef.current = true;

    if (!touchedRef.current.name) {
      setInviteeName(
        buildRequesterName(profile?.accounts, [
          appUser?.accountName,
          user?.email,
          "Usuario del ERP",
        ]),
      );
    }
    if (!touchedRef.current.phone) {
      setInviteePhone(
        normalizePhone(profile?.phone as string | number | null | undefined),
      );
    }
  }, [open, profileLoading, profile, appUser?.accountName, user?.email]);

  // Cambiar de capacitador invalida el horario elegido: los slots son suyos.
  useEffect(() => {
    setSelectedSlot(null);
  }, [slug]);

  const host = hosts.hosts.find((h) => h.slug === slug) ?? null;
  const trimmedName = inviteeName.trim();
  const phoneIsValid = isValidPhone(inviteePhone);
  const canSubmit =
    !!slug &&
    !!selectedSlot &&
    trimmedName.length >= MIN_REQUESTER_NAME_LENGTH &&
    phoneIsValid;

  const handleSubmit = async () => {
    if (!canSubmit || !slug || !selectedSlot) return;

    setSending(true);
    try {
      await createTrainingBooking({
        slug,
        start: selectedSlot,
        inviteeName: trimmedName,
        inviteePhone: normalizePhone(inviteePhone) || undefined,
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
      toastError(error, "Intenta nuevamente en unos minutos.");
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
            <Label htmlFor="training-invitee-name">Nombre</Label>
            <Input
              id="training-invitee-name"
              value={inviteeName}
              maxLength={MAX_REQUESTER_NAME_LENGTH}
              placeholder="Nombre y apellidos"
              onChange={(event) => {
                touchedRef.current.name = true;
                setInviteeName(event.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-invitee-phone">Celular (opcional)</Label>
            <Input
              id="training-invitee-phone"
              value={inviteePhone}
              inputMode="tel"
              maxLength={20}
              placeholder="+51 999 999 999"
              onChange={(event) => {
                touchedRef.current.phone = true;
                setInviteePhone(event.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Se lo compartimos al capacitador para poder contactarte.
            </p>
          </div>

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
          <Button onClick={handleSubmit} disabled={!canSubmit || sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
