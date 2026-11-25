import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField } from "@/shared/components/date-range";
import { RestPayload } from "../../types/attendance.types";
import { formatMinutes } from "../../utils/format";

interface UseBankDialogProps {
  /** Trabajador al que se le registra el descanso; null = cerrado. */
  employee: { id: number; name: string; balanceMinutes: number } | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: RestPayload) => Promise<boolean>;
}

/**
 * Usar horas de la bolsa (feriados con descanso y horas extra): cuántas horas
 * usa ese día, para descansar, llegar tarde o salir antes. Ese día no cuenta como falta ni tardanza y, si cobra por hora, se le
 * pagan esas horas. No puede pasar su saldo (lo valida el servidor).
 */
export const UseBankDialog = ({ employee, saving, onOpenChange, onSave }: UseBankDialogProps) => {
  const [day, setDay] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [mins, setMins] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!employee) return;
    setDay(null);
    setHours("");
    setMins("");
    setNote("");
  }, [employee]);

  const minutos = (Number(hours) || 0) * 60 + (Number(mins) || 0);
  const saldo = employee?.balanceMinutes ?? 0;
  const pasa = minutos > saldo;
  const faltan = [!day && "día", minutos <= 0 && "horas"].filter(Boolean) as string[];

  const guardar = async () => {
    if (!employee || !day) return;
    const ok = await onSave({
      id: null,
      employeeId: employee.id,
      day,
      fullDay: false,
      minutes: minutos,
      note: note.trim() || null,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={employee !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Usar horas de la bolsa</DialogTitle>
          <DialogDescription>
            {employee?.name} · tiene <span className="font-semibold">{formatMinutes(saldo)}</span> en su bolsa de horas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rest-day" required>
              Día en que las usa
            </Label>
            <DateField id="rest-day" value={day} onChange={setDay} maxDate={null} placeholder="Elige el día" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rest-hours" required>
              ¿Cuántas horas usa?
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="rest-hours"
                aria-label="Horas"
                className="w-16 text-right tabular-nums"
                inputMode="numeric"
                value={hours}
                onChange={(e) => setHours(e.target.value.replace(/\D/g, "").slice(0, 2))}
              />
              <span className="text-sm">h</span>
              <Input
                aria-label="Minutos"
                className="w-16 text-right tabular-nums"
                inputMode="numeric"
                value={mins}
                onChange={(e) => setMins(e.target.value.replace(/\D/g, "").slice(0, 2))}
              />
              <span className="text-sm">min</span>
            </div>
            <p className="text-xs text-muted-foreground">Para llegar tarde, salir antes o descansar ese día.</p>
            {pasa && <p className="text-xs text-destructive">Le quedan {formatMinutes(saldo)} en la bolsa.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rest-note">Nota</Label>
            <Input
              id="rest-note"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Llega a las 10:00 por un trámite"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="gap-2"
            onClick={() => void guardar()}
            disabled={saving || faltan.length > 0 || pasa}
            title={faltan.length > 0 ? `Falta: ${faltan.join(", ")}` : undefined}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
