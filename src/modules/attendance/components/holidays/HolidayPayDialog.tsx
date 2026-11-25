import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDateDisplay } from "@/shared/utils/date";
import { AttendanceSettings, HolidayCompensation } from "../../types/attendance.types";
import { surchargePct } from "../../utils/holidays";

type Amount = "double" | "custom";

interface HolidayPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AttendanceSettings | null;
  saving: boolean;
  /** Se guarda como multiplicador (100 % más = × 2) y qué se hace por defecto. */
  onSave: (multiplier: number, compensation: HolidayCompensation) => Promise<boolean>;
}

const soles = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const TARIFA_EJEMPLO = 10;

const Option = ({ value, title, children }: { value: string; title: string; children?: ReactNode }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
    <RadioGroupItem value={value} className="mt-0.5" />
    <span className="flex-1">
      <span className="block font-medium">{title}</span>
      {children}
    </span>
  </label>
);

/**
 * Pago en feriado, sin fórmulas: qué se hace si alguien trabaja un feriado
 * (pagarle con el aumento o darle ese tiempo como descanso; se cambia por caso
 * en el Cuadre de horas) y cuánto más se paga (al doble u otro porcentaje).
 */
export const HolidayPayDialog = ({ open, onOpenChange, settings, saving, onSave }: HolidayPayDialogProps) => {
  const [compensation, setCompensation] = useState<HolidayCompensation>("PAY");
  const [amount, setAmount] = useState<Amount>("double");
  const [custom, setCustom] = useState("50");

  useEffect(() => {
    if (!open || !settings) return;
    const pct = surchargePct(settings.holidayPayMultiplier);
    setCompensation(settings.holidayDefaultCompensation);
    setAmount(pct === 100 || pct < 1 ? "double" : "custom");
    setCustom(pct === 100 || pct < 1 ? "50" : String(pct));
  }, [open, settings]);

  const customPct = Number(custom.replace(",", "."));
  const customOk = Number.isFinite(customPct) && customPct >= 1 && customPct <= 200;
  const pct = amount === "double" ? 100 : customOk ? customPct : null;
  const factor = pct !== null ? 1 + pct / 100 : null;
  const conAumento = compensation === "PAY";
  // Con descanso el aumento no se usa: se guarda el que ya estaba.
  const aGuardar = conAumento ? factor : (factor ?? settings?.holidayPayMultiplier ?? 2);

  const guardar = async () => {
    if (aGuardar === null) return;
    if (await onSave(aGuardar, compensation)) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pago en feriado</DialogTitle>
          <DialogDescription>
            Lo que se hace por defecto; en el Cuadre de horas se puede cambiar para cada caso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium">Si alguien trabaja un feriado…</p>
          <RadioGroup
            value={compensation}
            onValueChange={(v) => setCompensation(v as HolidayCompensation)}
            className="space-y-1"
          >
            <Option value="PAY" title="Se le paga con aumento">
              <span className="block text-sm text-muted-foreground">
                Esas horas salen como «horas extra por feriado» y se pagan con el aumento de abajo.
              </span>
            </Option>
            <Option value="REST" title="Se le da descanso en otro día">
              <span className="block text-sm text-muted-foreground">
                Esas horas se pagan normal y pasan a su bolsa de horas. Luego las usa otro día: completo o unas horas.
              </span>
            </Option>
          </RadioGroup>
        </div>

        {conAumento ? (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">¿Cuánto más se paga la hora en feriado?</p>
              <RadioGroup value={amount} onValueChange={(v) => setAmount(v as Amount)} className="space-y-1">
                <Option value="double" title="Al doble">
                  <span className="block text-sm text-muted-foreground">100 % más. Es lo que pide la ley.</span>
                </Option>
                <Option value="custom" title="Otro porcentaje">
                  <span className="mt-1.5 flex items-center gap-1.5">
                    <Input
                      aria-label="Porcentaje de aumento"
                      className="w-24 text-right tabular-nums"
                      inputMode="decimal"
                      value={custom}
                      disabled={amount !== "custom"}
                      onChange={(e) => setCustom(e.target.value)}
                      aria-invalid={amount === "custom" && !customOk}
                    />
                    <span className="text-sm">% más</span>
                  </span>
                  {amount === "custom" && !customOk && (
                    <span className="mt-1 block text-xs text-destructive">Escribe un número de 1 a 200.</span>
                  )}
                </Option>
              </RadioGroup>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted p-3 text-sm">
              <p>
                Ejemplo: si gana <span className="font-semibold">{soles(TARIFA_EJEMPLO)}</span> la hora, en feriado gana{" "}
                <span className="font-semibold">{factor !== null ? soles(TARIFA_EJEMPLO * factor) : "…"}</span> la hora.
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Por hora:</span> cobra cada hora del feriado con ese
                  aumento.
                </li>
                <li>
                  <span className="font-medium text-foreground">Con sueldo:</span> su sueldo no cambia; se le suma
                  aparte lo trabajado en el feriado con ese aumento.
                </li>
                <li>
                  <span className="font-medium text-foreground">A destajo:</span> cobra por pieza, como siempre.
                </li>
              </ul>
              {settings?.holidayPayFrom && (
                <p className="text-xs text-muted-foreground">
                  Rige para lo marcado desde el {formatDateDisplay(settings.holidayPayFrom)}.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2 rounded-lg border bg-muted p-3 text-sm">
            <p>
              Ejemplo: si trabaja <span className="font-semibold">4 h</span> en el feriado, cobra esas horas como un día
              normal y le quedan <span className="font-semibold">4 h en su bolsa de horas</span> para usar otro día.
            </p>
            <p className="text-muted-foreground">
              Las horas de la bolsa se usan en Asistencia › Pagos: un día completo (se descuenta su jornada) o unas
              horas. Ese día no cuenta como falta.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={() => void guardar()} disabled={saving || aGuardar === null}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
