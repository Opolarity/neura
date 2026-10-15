import { useCallback, useEffect, useMemo, useState } from "react"

import {
  listPagesPaged,
  type StatusCounts,
  type TypeCounts,
  type VisualEditListItem,
  type VisualEditRecord,
  type VisualEditStatus,
} from "@/modules/ecommerce/editor/lib/editor-store"
import { useDebounce } from "@/modules/ecommerce/editor/hooks/use-debounce"

/** El filtro de las pestanas. "all" no viaja: es la ausencia de `status`. */
export type StatusFilter = "all" | VisualEditStatus

interface UsePagedVisualEditsOptions {
  types: VisualEditRecord["type"][]
  size: number
  /** La vista de papelera: pide solo lo que esta en `trash`. */
  trash?: boolean
}

const SIN_CONTEOS: StatusCounts = { all: 0, published: 0, draft: 0 }

// Listado del dashboard del editor: busqueda, filtro de estado y paginacion las
// resuelve la edge function, asi que cada cambio es una peticion nueva. De la
// misma respuesta salen las tres cosas que se pintan: las filas de la seccion
// abierta, los conteos de las pestanas y los del menu lateral.
export function usePagedVisualEdits({ types, size, trash }: UsePagedVisualEditsOptions) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [status, setStatus] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<VisualEditListItem[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<StatusCounts>(SIN_CONTEOS)
  const [typeCounts, setTypeCounts] = useState<TypeCounts>({})
  const [loading, setLoading] = useState(true)
  // La peticion fallo: ni hay filas ni se sabe si las hay. Es un estado propio
  // porque pintar el vacio de siempre invitaria a crear algo cuando lo unico
  // que pasa es que no se pudo leer.
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  // `types` llega como array literal desde el componente: su identidad cambia en
  // cada render y dispararia el efecto en bucle. La clave si es estable.
  const typesKey = types.join(",")

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typesKey, status])

  useEffect(() => {
    let cancelled = false

    const fetchPage = async () => {
      setLoading(true)
      const result = await listPagesPaged({
        types: typesKey.split(",") as VisualEditRecord["type"][],
        search: debouncedSearch,
        status: status === "all" ? undefined : status,
        trash,
        page,
        size,
      })
      if (cancelled) return

      if (result.ok === false) {
        // Las filas de antes se van: dejarlas puestas bajo un aviso de fallo
        // diria que eso es lo que hay, cuando justamente no se sabe.
        setError(true)
        setItems([])
        setTotal(0)
        setLoading(false)
        return
      }

      setError(false)
      setItems(result.data.data)
      setTotal(result.data.total)
      // Los conteos son opcionales: la version anterior de la edge function no
      // los manda. Mejor dejar los de antes que parpadear a cero.
      if (result.data.counts) setCounts(result.data.counts)
      if (result.data.type_counts) setTypeCounts(result.data.type_counts)
      setLoading(false)
    }

    fetchPage()
    return () => {
      cancelled = true
    }
  }, [typesKey, debouncedSearch, status, page, size, trash, reloadToken])

  const totalPages = Math.max(1, Math.ceil(total / size))

  // Al borrar la ultima fila de la ultima pagina esa pagina deja de existir: sin
  // esto la lista se quedaria vacia sin explicacion.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const refresh = useCallback((resetToFirstPage = false) => {
    if (resetToFirstPage) setPage(1)
    setReloadToken((token) => token + 1)
  }, [])

  return useMemo(
    () => ({
      items,
      total,
      totalPages,
      page,
      size,
      setPage,
      search,
      setSearch,
      status,
      setStatus,
      counts,
      typeCounts,
      // Distinguir "no hay nada" de "la busqueda no encontro nada" cambia el
      // mensaje del estado vacio. El filtro de estado cuenta igual: con
      // "Borradores" marcado y ninguno, tampoco es que no haya nada.
      isFiltering: debouncedSearch.trim() !== "" || status !== "all",
      isSearching: debouncedSearch.trim() !== "",
      loading,
      error,
      refresh,
      // Reintentar es volver a pedir la misma pagina con los mismos filtros:
      // lo que fallo fue la peticion, no lo que se pidio.
      retry: refresh,
    }),
    [
      items,
      total,
      totalPages,
      page,
      size,
      search,
      debouncedSearch,
      status,
      counts,
      typeCounts,
      loading,
      error,
      refresh,
    ]
  )
}
