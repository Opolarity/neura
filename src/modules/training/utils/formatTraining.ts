/**
 * Formateo de fechas de capacitaciones.
 *
 * Los instantes llegan en UTC y NUNCA se convierten a mano: se le pasan a
 * Intl con la zona en la que se quieren mostrar. Restar horas a un ISO es
 * cómo se rompe el horario de verano.
 */

const LOCALE = "es-PE";

/** Zona del navegador: es la del usuario del ERP, no la del capacitador. */
export const browserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Lima";

export const formatTrainingDate = (iso: string, timeZone = browserTimeZone()): string =>
  new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(new Date(iso));

export const formatTrainingTime = (iso: string, timeZone = browserTimeZone()): string =>
  new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));

/** "vie, 21 ago, 10:00" — para la celda de la tabla. */
export const formatTrainingDateTime = (iso: string, timeZone = browserTimeZone()): string =>
  new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));

/** Clave de día civil, para agrupar los slots del calendario. */
export const dayKey = (iso: string, timeZone = browserTimeZone()): string =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date(iso));
