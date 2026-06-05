export const LIMA_TIME_ZONE = "America/Lima";
export const LIMA_OFFSET = "-05:00";

export const getTodayDate = (): string => {
  return new Date().toLocaleDateString("sv-SE", { timeZone: LIMA_TIME_ZONE });
};

export const toLimaDateInput = (date: Date): string => {
  return date.toLocaleDateString("sv-SE", { timeZone: LIMA_TIME_ZONE });
};

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
