/**
 * Utilidades para construcción de query strings y endpoints
 */

/**
 * Limpia un objeto de filtros eliminando valores undefined, null y strings vacíos
 */
export const cleanFilters = <T extends object>(filters: T): Record<string, string> => {
  return Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>);
};

/**
 * Construye un query string a partir de un objeto de filtros
 * Automáticamente elimina valores undefined, null y strings vacíos
 */
export const buildQueryString = <T extends object>(filters: T): string => {
  const cleaned = cleanFilters(filters);
  return new URLSearchParams(cleaned).toString();
};

/**
 * Construye un endpoint completo con query string
 * @param baseEndpoint - El endpoint base (ej: "get-products-list")
 * @param filters - Objeto con los filtros a aplicar
 * @returns El endpoint con query string si hay filtros, o solo el endpoint base
 */
export const buildEndpoint = <T extends object>(baseEndpoint: string, filters: T): string => {
  const queryString = buildQueryString(filters);
  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
};
