import { WEEKDAY_LABELS } from "../types/attendance.types";

export type HolidayStatus = "today" | "upcoming" | "past";

export const HOLIDAY_STATUS: Record<HolidayStatus, { label: string; variant: "success" | "info" | "pending" }> = {
  today: { label: "Hoy", variant: "success" },
  upcoming: { label: "Próximo", variant: "info" },
  past: { label: "Pasado", variant: "pending" },
};

/** Día de la semana de una fecha "YYYY-MM-DD" (fecha de calendario, sin zona horaria). */
export const holidayWeekday = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return WEEKDAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7];
};

/** Hoy, próximo o pasado, contra el día de hoy en Lima ("YYYY-MM-DD"). */
export const holidayStatus = (day: string, today: string): HolidayStatus =>
  day === today ? "today" : day > today ? "upcoming" : "past";

/** Aumento en % de la hora en feriado a partir del multiplicador guardado (× 2 = 100 %). */
export const surchargePct = (multiplier: number) => Math.round((multiplier - 1) * 100);

/** Cómo se cobra la hora en feriado, para leer en una frase: "al doble", "igual que un día normal", "un 50 % más". */
export const holidayPayPhrase = (multiplier: number) => {
  const pct = surchargePct(multiplier);
  if (pct === 100) return "al doble (100 % más)";
  return `con un ${pct.toLocaleString("es-PE")} % más`;
};
