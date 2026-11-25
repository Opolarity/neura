import { Button } from "@/components/ui/button";
import { AttendanceSettings } from "../../types/attendance.types";
import { holidayPayPhrase } from "../../utils/holidays";

interface HolidayRulesStripProps {
  settings: AttendanceSettings | null;
  onChangePay: () => void;
}

/** Qué hace un feriado, en una frase, y el acceso a cambiar cómo se paga. */
export const HolidayRulesStrip = ({ settings, onChangePay }: HolidayRulesStripProps) => (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted px-4 py-3 text-sm">
    <span>
      En un feriado <span className="font-semibold">nadie tiene falta ni tardanza</span>.{" "}
      {!settings ? (
        "…"
      ) : settings.holidayDefaultCompensation === "REST" ? (
        <>
          Quien trabaja <span className="font-semibold">suma esas horas a su bolsa de horas</span> para usarlas otro día.
        </>
      ) : (
        <>
          Quien trabaja cobra la hora <span className="font-semibold">{holidayPayPhrase(settings.holidayPayMultiplier)}</span>.
        </>
      )}
    </span>
    <Button variant="outline" size="sm" onClick={onChangePay} disabled={!settings}>
      Cambiar pago
    </Button>
  </div>
);
