import { addCalendarDays, formatDateDisplay, getTodayDate, toLimaDateInput } from '@/shared/utils/date';

/**
 * T-1158: cuánto del rango pedido cubre "Desempeño por regla". El detalle por
 * regla existe desde la implementación (`tracked_from`); antes no hay datos.
 *
 * - `full`:    el rango empieza ese día o después, la sección se ve normal.
 * - `partial`: el rango cruza la fecha, solo cuenta desde la implementación.
 * - `none`:    el rango termina antes, no hay nada que mostrar.
 * - `empty`:   todavía no se registró ninguna venta con este detalle.
 */
export type PerformanceCoverage =
  | { kind: 'full' | 'none'; since: string }
  | { kind: 'partial'; since: string; start: string; end: string }
  | { kind: 'empty' };

export function getPerformanceCoverage(
  trackedFrom: string | null | undefined,
  startDate: string | null,
  endDate: string | null,
): PerformanceCoverage {
  if (!trackedFrom) return { kind: 'empty' };
  // Día de Lima, igual que el rango del SP (que sin fechas toma los últimos 30 días).
  const since = toLimaDateInput(new Date(trackedFrom));
  const end = endDate ?? getTodayDate();
  const start = startDate ?? addCalendarDays(end, -30);
  if (end < since) return { kind: 'none', since };
  if (start < since) return { kind: 'partial', since, start, end };
  return { kind: 'full', since };
}

/** Aviso para el rango que cruza la fecha (pantalla y Excel dicen lo mismo). */
export function partialCoverageNotice(c: Extract<PerformanceCoverage, { kind: 'partial' }>): string {
  return `Este detalle existe desde el ${formatDateDisplay(c.since)}. Del rango pedido (${formatDateDisplay(c.start)} – ${formatDateDisplay(c.end)}) solo se cuentan las ventas del ${formatDateDisplay(c.since)} al ${formatDateDisplay(c.end)}.`;
}

/** Mensaje para el rango que termina antes de la implementación. */
export function noCoverageNotice(since: string): string {
  return `Desempeño por regla está disponible desde el ${formatDateDisplay(since)}. Elige un rango desde esa fecha para verlo.`;
}
