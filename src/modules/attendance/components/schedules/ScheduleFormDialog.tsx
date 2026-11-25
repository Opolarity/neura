import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Schedule, SchedulePayload, WEEKDAY_LABELS } from "../../types/attendance.types";

interface DayRow {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: string;
}

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  saving: boolean;
  onSave: (payload: SchedulePayload) => Promise<boolean>;
}

const defaultDays = (): DayRow[] =>
  [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    enabled: weekday <= 5,
    startTime: "08:00",
    endTime: "17:00",
    breakMinutes: "60",
  }));

/** Horario por día de la semana; un día sin marcar es libre. Salida antes que entrada = turno de noche. */
export const ScheduleFormDialog = ({ open, onOpenChange, schedule, saving, onSave }: ScheduleFormDialogProps) => {
  const [name, setName] = useState("");
  const [tolerance, setTolerance] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [days, setDays] = useState<DayRow[]>(defaultDays);

  useEffect(() => {
    if (!open) return;
    setName(schedule?.name ?? "");
    setTolerance(String(schedule?.toleranceMinutes ?? 10));
    setIsActive(schedule?.isActive ?? true);
    setDays(
      schedule
        ? [1, 2, 3, 4, 5, 6, 7].map((weekday) => {
            const d = schedule.days.find((x) => x.weekday === weekday);
            return {
              weekday,
              enabled: !!d,
              startTime: d?.startTime ?? "08:00",
              endTime: d?.endTime ?? "17:00",
              breakMinutes: String(d?.breakMinutes ?? 60),
            };
          })
        : defaultDays(),
    );
  }, [open, schedule]);

  const setDay = (weekday: number, patch: Partial<DayRow>) =>
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));

  const activos = days.filter((d) => d.enabled);
  const faltan = [
    !name.trim() && "Nombre",
    activos.length === 0 && "Al menos un día",
    activos.some((d) => !d.startTime || !d.endTime) && "Horas de entrada y salida",
  ].filter(Boolean) as string[];

  const guardar = async () => {
    if (faltan.length > 0) return;
    const ok = await onSave({
      id: schedule?.id ?? null,
      name: name.trim(),
      toleranceMinutes: Math.max(0, Number(tolerance) || 0),
      isActive,
      days: activos.map((d) => ({
        weekday: d.weekday,
        startTime: d.startTime,
        endTime: d.endTime,
        breakMinutes: Math.max(0, Number(d.breakMinutes) || 0),
      })),
    });
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{schedule ? "Editar horario" : "Nuevo horario"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_160px_auto] items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sch-name" required>
                Nombre
              </Label>
              <Input id="sch-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Planta L-V" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sch-tol">Tolerancia (min)</Label>
              <Input id="sch-tol" type="number" min="0" value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch id="sch-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="sch-active">Activo</Label>
            </div>
          </div>
          <div className="space-y-2">
            {days.map((d) => (
              <div key={d.weekday} className="grid grid-cols-[130px_1fr_1fr_120px] items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={d.enabled} onCheckedChange={(v) => setDay(d.weekday, { enabled: v === true })} />
                  {WEEKDAY_LABELS[d.weekday]}
                </label>
                <Input
                  type="time"
                  aria-label={`Entrada ${WEEKDAY_LABELS[d.weekday]}`}
                  disabled={!d.enabled}
                  value={d.startTime}
                  onChange={(e) => setDay(d.weekday, { startTime: e.target.value })}
                />
                <Input
                  type="time"
                  aria-label={`Salida ${WEEKDAY_LABELS[d.weekday]}`}
                  disabled={!d.enabled}
                  value={d.endTime}
                  onChange={(e) => setDay(d.weekday, { endTime: e.target.value })}
                />
                <Input
                  type="number"
                  min="0"
                  aria-label={`Refrigerio ${WEEKDAY_LABELS[d.weekday]} en minutos`}
                  title="Refrigerio en minutos"
                  disabled={!d.enabled}
                  value={d.breakMinutes}
                  onChange={(e) => setDay(d.weekday, { breakMinutes: e.target.value })}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Columnas: entrada, salida y refrigerio (min). El refrigerio se descuenta si el trabajador no lo marca.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="gap-2"
            onClick={() => void guardar()}
            disabled={saving || faltan.length > 0}
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
