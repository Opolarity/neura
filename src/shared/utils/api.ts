/**
 * Utilidades para manejo de respuestas de API
 */

export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Extrae información de paginación de una respuesta de API
 * Soporta múltiples formatos de respuesta comunes
 */
export const extractPagination = (
  pageData: Record<string, unknown>
): PaginationInfo => {
  return {
    page: (pageData.page ?? pageData.p_page ?? 1) as number,
    size: (pageData.size ?? pageData.p_size ?? 20) as number,
    total: (pageData.total ?? 0) as number,
  };
};

/**
 * Crea un adapter genérico para respuestas paginadas
 * @param mapper - Función que transforma cada item de la respuesta
 */
export function createPaginatedAdapter<TInput, TOutput>(
  mapper: (item: TInput) => TOutput
) {
  return (
    data: TInput[],
    pageData: Record<string, unknown>
  ): PaginatedResponse<TOutput> => ({
    data: data.map(mapper),
    pagination: extractPagination(pageData),
  });
}

/**
 * Valor por defecto para respuestas paginadas vacías
 */
export const emptyPaginatedResponse = <T>(): PaginatedResponse<T> => ({
  data: [],
  pagination: { page: 1, size: 20, total: 0 },
});
