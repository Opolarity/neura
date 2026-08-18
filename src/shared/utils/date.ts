export const LIMA_TIME_ZONE = "America/Lima";
export const LIMA_OFFSET = "-05:00";

export const getTodayDate = (): string => {
  return new Date().toLocaleDateString("sv-SE", { timeZone: LIMA_TIME_ZONE });
};

export const toLimaDateInput = (date: Date): string => {
  return date.toLocaleDateString("sv-SE", { timeZone: LIMA_TIME_ZONE });
};

/** Día 1 del mes en curso en Lima, como "YYYY-MM-DD". */
export const getFirstDayOfMonth = (): string => `${getTodayDate().slice(0, 7)}-01`;

/**
 * "YYYY-MM-DD" → Date anclado a medianoche LOCAL (no UTC).
 * `new Date("2026-07-29")` se parsea como medianoche UTC, que en Lima es el día
 * anterior a las 19:00; reemplazar los guiones por barras fuerza el parseo local.
 * Es lo que esperan react-day-picker y la aritmética de calendario.
 */
export const parseLocalDate = (dateString: string): Date => {
  return new Date(dateString.replace(/-/g, "/"));
};

/**
 * Inversa de parseLocalDate: Date de calendario → "YYYY-MM-DD" por componentes
 * locales. Reemplaza a `format(d, "yyyy-MM-dd")` de date-fns.
 */
export const toDateInputValue = (date: Date): string => {
  return date.toLocaleDateString("sv-SE");
};

/** Aritmética de calendario sobre "YYYY-MM-DD", agnóstica a la zona del navegador. */
export const addCalendarDays = (dateString: string, days: number): string => {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
};

/** Días de calendario entre dos "YYYY-MM-DD". Misma escala que addCalendarDays. */
export const diffCalendarDays = (from: string, to: string): number => {
  return Math.round(
    (parseLocalDate(to).getTime() - parseLocalDate(from).getTime()) / 86_400_000
  );
};

export const nowIso = (): string => new Date().toISOString();

export const limaDateTimeLocalToIso = (local: string | null | undefined): string => {
  if (!local || typeof local !== "string" || local.trim() === "") return "";
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(local)) return local;
  const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(local);
  return `${local}${hasSeconds ? "" : ":00"}${LIMA_OFFSET}`;
};

/**
 * Inversa de limaDateTimeLocalToIso: ISO (con o sin timezone) → "YYYY-MM-DDTHH:mm"
 * en hora Lima, listo para un <input type="datetime-local">.
 */
export const limaIsoToDateTimeLocal = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hh = get("hour").padStart(2, "0");
  const mm = get("minute").padStart(2, "0");
  return `${get("year")}-${get("month")}-${get("day")}T${hh}:${mm}`;
};

/** Fecha y hora actual de Lima en formato datetime-local ("YYYY-MM-DDTHH:mm"). */
export const getLimaDateTimeNow = (): string => limaIsoToDateTimeLocal(nowIso());

export const limaDateRangeToIsoBounds = (
  date: string | null | undefined
): { start: string | null; end: string | null } => {
  if (!date) return { start: null, end: null };
  return {
    start: `${date}T00:00:00.000${LIMA_OFFSET}`,
    end: `${date}T23:59:59.999${LIMA_OFFSET}`,
  };
};

export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(dateString.replace(/-/g, "/"))
    : new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateLong = (dateString: string): string => {
  if (!dateString) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(dateString.replace(/-/g, "/"))
    : new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatTime = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
