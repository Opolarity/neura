export const LIMA_TIME_ZONE = "America/Lima";
export const LIMA_OFFSET = "-05:00";

export const getTodayDate = (): string => {
  return new Date().toLocaleDateString("sv-SE", { timeZone: LIMA_TIME_ZONE });
};

/**
 * INSTANTE (Date de un timestamptz del backend) → "YYYY-MM-DD" del día en Lima.
 * Para Date de calendario, la que va es `toDateInputValue`.
 */
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
 * Inversa exacta de `parseLocalDate`: Date de CALENDARIO → "YYYY-MM-DD".
 *
 * Criterio (es lo que separa esta función de `toLimaDateInput`, arriba):
 *   - `toDateInputValue` es para los Date que produce el calendario de la UI
 *     (react-day-picker), que son medianoche del huso del navegador y NO
 *     representan un instante: se leen por componentes locales, sin zona, o el
 *     día elegido con el dedo dejaría de ser el día que se guarda.
 *   - `toLimaDateInput` es para INSTANTES que vienen del backend (timestamptz,
 *     ISO con hora): esos sí se resuelven en `America/Lima`.
 *
 * Se arma a mano en vez de con `toLocaleDateString("sv-SE")` para que no
 * dependa de que el runtime tenga ese locale.
 */
export const toDateInputValue = (date: Date): string => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

/** "YYYY-MM-DD" a secas: un día civil, sin hora y sin zona. */
const CIVIL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

/**
 * Fecha para mostrar, "DD/MM/YYYY".
 *
 * Un día civil ("2026-09-03", lo que devuelven las columnas `date` y los SPs
 * que ya resuelven el día en Lima) NO pasa por `Date`: se formatea desde los
 * componentes del string. Antes se hacía `new Date("2026/09/03")`, que ancla
 * el día a medianoche del huso DEL NAVEGADOR, y al formatear después con
 * `timeZone: "America/Lima"` el resultado se corría un día en cualquier
 * navegador al este de Lima (Madrid, Buenos Aires, un móvil en itinerancia) y
 * en cualquier render de servidor, que corre en UTC.
 *
 * Un instante (ISO con hora) sí pasa por `Date` y se resuelve en Lima, que es
 * justamente lo que hay que hacer con un timestamptz.
 */
export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const civil = CIVIL_DATE_RE.exec(dateString);
  if (civil) {
    const [, year, month, day] = civil;
    return `${day}/${month}/${year}`;
  }
  return new Date(dateString).toLocaleDateString("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/** Igual que formatDateDisplay pero en largo ("3 de septiembre de 2026"). */
export const formatDateLong = (dateString: string): string => {
  if (!dateString) return "";
  const civil = CIVIL_DATE_RE.exec(dateString);
  if (civil) {
    const [, year, month, day] = civil;
    return `${Number(day)} de ${MONTHS_ES[Number(month) - 1]} de ${year}`;
  }
  return new Date(dateString).toLocaleDateString("es-PE", {
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
