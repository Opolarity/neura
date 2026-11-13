import { useMemo, useState } from 'react';
import type { PaginationState } from '@/shared/components/pagination/Pagination';

/**
 * Paginación en el navegador para tablas de reporte que ya tienen todas sus filas
 * (el SP las devuelve completas). Usa los mismos datos que `PaginationBar`.
 *
 * Vuelve a la página 1 cuando cambian las filas (otro rango, otro filtro u otra
 * vista). Por eso `rows` debe ser estable entre renders (memoizado o salido de la
 * query): un arreglo nuevo en cada render reiniciaría la página sin fin.
 */
export function useClientPagination<T>(rows: T[], initialSize = 20) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  const [lastRows, setLastRows] = useState(rows);

  if (lastRows !== rows) {
    setLastRows(rows);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, totalPages);

  const pageRows = useMemo(
    () => rows.slice((current - 1) * size, current * size),
    [rows, current, size],
  );

  const pagination: PaginationState = { p_page: current, p_size: size, total: rows.length };

  return {
    pageRows,
    pagination,
    onPageChange: setPage,
    onPageSizeChange: (next: number) => {
      setSize(next);
      setPage(1);
    },
  };
}
