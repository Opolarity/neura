import { diffCalendarDays, getTodayDate } from "@/shared/utils/date";

/**
 * Quién tiene un proceso y si va tarde, como se lee en «Avance por talla» y
 * en la ruta de la pizarra (2026-10-15). Una sola regla para las dos vistas,
 * para que no digan cosas distintas del mismo encargo.
 */

/** El taller en corto: sus dos primeras palabras («JUAN CARLOS»). */
export const tallerCorto = (supplierName: string | null | undefined): string | null =>
  supplierName ? supplierName.split(" ").slice(0, 2).join(" ") : null;

/** Días de atraso de un proceso abierto respecto de lo pactado; 0 si no va tarde. */
export const diasDeAtraso = (promisedDate: string | null, completo: boolean): number =>
  !completo && promisedDate ? Math.max(0, diffCalendarDays(promisedDate, getTodayDate())) : 0;
