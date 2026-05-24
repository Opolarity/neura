const LIMA_TZ = "America/Lima";

export const getTodayDate = (): string => {
  return new Date().toLocaleDateString("sv-SE", { timeZone: LIMA_TZ });
};

export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(dateString.replace(/-/g, "/"))
    : new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    timeZone: LIMA_TZ,
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
    timeZone: LIMA_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("es-PE", {
    timeZone: LIMA_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
