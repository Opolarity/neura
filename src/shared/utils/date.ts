/**
 * Utilidades para manejo y formateo de fechas
 */

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Formatea una fecha para mostrar en formato DD/MM/YYYY (locale es-PE)
 */
export const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatea una fecha para mostrar en formato largo (ej: "28 de enero de 2026")
 */
export const formatDateLong = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Formatea una fecha con hora (DD/MM/YYYY HH:mm)
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
