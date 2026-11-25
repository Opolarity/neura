import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField } from "@/shared/components/date-range";
import { Holiday } from "../../types/attendance.types";
import { holidayWeekday } from "../../utils/holidays";

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: Holiday | null;
  saving: boolean;
  onSave: (h: { id: number | null; day: string; name: string }) => Promise<boolean>;
}

/** Crear o editar un feriado: fecha (con el día de la semana en que cae) y nombre. */
export const HolidayFormDialog = ({ open, onOpenChange, holiday, saving, onSave }: HolidayFormDialogProps) => {
  const [day, setDay] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setDay(holiday?.day ?? null);
    setName(holiday?.name ?? "");
  }, [open, holiday]);

  const faltan = [!day && "fecha", !name.trim() && "nombre"].filter(Boolean) as string[];

  const guardar = async () => {
    if (!day || !name.trim()) return;
    if (await onSave({ id: holiday?.id ?? null, day, name: name.trim() })) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{holiday ? "Editar feriado" : "Agregar feriado"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="holiday-day" required>
              Fecha
            </Label>
            <DateField
              id="holiday-day"
              value={day}
              onChange={setDay}
              maxDate={null}
              placeholder="Elige la fecha"
            />
            {day && <p className="text-xs text-muted-foreground">Cae {holidayWeekday(day).toLowerCase()}.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="holiday-name" required>
              Nombre
            </Label>
            <Input
              id="holiday-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fiestas Patrias"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Ese día nadie tendrá falta ni tardanza, y quien trabaje cobrará la hora con el aumento de «Pago en feriado».
          </p>
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
