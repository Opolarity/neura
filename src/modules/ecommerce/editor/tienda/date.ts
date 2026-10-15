export const LIMA_TIME_ZONE = "America/Lima";
export const LIMA_OFFSET = "-05:00";

export const nowIso = (): string => new Date().toISOString();

export const limaDateTimeLocalToIso = (local: string | null | undefined): string => {
  if (!local || typeof local !== "string" || local.trim() === "") return "";
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(local)) return local;
  const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(local);
  return `${local}${hasSeconds ? "" : ":00"}${LIMA_OFFSET}`;
};

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

/**
 * Fecha para mostrar, "DD/MM/YYYY".
 *
 * Un día civil ("2026-09-03") NO pasa por `Date`: se formatea desde los
 * componentes del string. Antes se hacía `new Date("2026/09/03")`, que ancla
 * el día a medianoche del huso del proceso, y al formatear después con
 * `timeZone: "America/Lima"` el resultado se corría un día. Acá era más grave
 * que en el ERP: el contenedor de Next.js corre en UTC, así que el render de
 * SERVIDOR caía SIEMPRE en el día anterior y el cliente lo re-pintaba distinto
 * al hidratar.
 *
 * Un instante (ISO con hora) sí pasa por `Date` y se resuelve en Lima.
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
    second: "2-digit",
    hour12: false,
  });
};

/**
 * ¿El producto está en exhibición ahora mismo?
 *
 * La regla es la misma que aplican los SPs del listado: mientras no haya pasado
 * la fecha de fin, el producto está en vitrina y NO se puede comprar (por eso la
 * tarjeta oculta tallas y precio, y el botón dice "Ver"). Pasada esa fecha se
 * comporta como cualquier otro producto.
 *
 * Se evalúa contra la fecha de fin y no contra el par completo porque el backend
 * garantiza que las dos van juntas o ninguna.
 */
export const isOnExhibition = (
  exhibitionEndDate: string | null | undefined,
): boolean => {
  if (!exhibitionEndDate) return false;
  const end = new Date(exhibitionEndDate);
  if (isNaN(end.getTime())) return false;
  return Date.now() <= end.getTime();
};

/**
 * Fecha de fin de exhibición como "19 de agosto", para el aviso de la tarjeta.
 * Devuelve "" si no hay fecha o si no parsea, para que quien la use pueda
 * decidir qué pintar en ese caso.
 */
export const formatExhibitionDate = (
  exhibitionEndDate: string | null | undefined,
): string => {
  if (!exhibitionEndDate) return "";
  const date = new Date(exhibitionEndDate);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    day: "numeric",
    month: "long",
  });
};
