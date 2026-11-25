import { useEffect, useMemo, useState } from "react";
import { PaginationState } from "@/shared/components/pagination/Pagination";

/**
 * Paginación en el navegador para listas que llegan completas y son cortas
 * (horarios, puntos, cuadre por trabajador), con el mismo PaginationBar que
 * los listados paginados en el servidor.
 */
export const useClientPagination = <T,>(items: T[], initialSize = 20) => {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);

  // Si la lista se achica (filtro, borrado), no quedarse en una página vacía.
  useEffect(() => {
    const last = Math.max(1, Math.ceil(items.length / size));
    if (page > last) setPage(last);
  }, [items.length, size, page]);

  const pageItems = useMemo(() => items.slice((page - 1) * size, page * size), [items, page, size]);
  const pagination: PaginationState = { p_page: page, p_size: size, total: items.length };

  return {
    pageItems,
    pagination,
    onPageChange: setPage,
    onPageSizeChange: (s: number) => {
      setSize(s);
      setPage(1);
    },
  };
};
