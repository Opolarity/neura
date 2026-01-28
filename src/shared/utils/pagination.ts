/**
 * Utilidades para cálculos de paginación
 */

/**
 * Calcula el número total de páginas
 */
export const totalPages = (total: number, pageSize: number): number =>
  Math.ceil(total / pageSize) || 1;

/**
 * Calcula el número del primer registro en la página actual
 */
export const startRecord = (total: number, pageSize: number, page: number): number =>
  total === 0 ? 0 : (page - 1) * pageSize + 1;

/**
 * Calcula el número del último registro en la página actual
 */
export const endRecord = (total: number, pageSize: number, page: number): number =>
  Math.min(page * pageSize, total);

/**
 * Retorna un objeto con todos los valores de paginación calculados
 */
export const getPaginationInfo = (total: number, pageSize: number, page: number) => ({
  totalPages: totalPages(total, pageSize),
  startRecord: startRecord(total, pageSize, page),
  endRecord: endRecord(total, pageSize, page),
  hasNextPage: page < totalPages(total, pageSize),
  hasPrevPage: page > 1,
});
