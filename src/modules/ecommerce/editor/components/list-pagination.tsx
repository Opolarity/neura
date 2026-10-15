import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Los tamanos de pagina que se ofrecen. El primero es el de arranque. */
export const TAMANOS_DE_PAGINA = [10, 20, 50, 100]

interface ListPaginationProps {
  page: number
  size: number
  total: number
  totalPages: number
  loading?: boolean
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

/**
 * La barra de paginacion del listado, con el aspecto de la del ERP: el selector
 * de tamano a la izquierda, y al lado los cuatro botones redondos con el
 * recuento en medio ("1 a 10 de 34").
 *
 * Vive dentro de un CardFooter con `!p-0`: el `p-4` de esta barra es todo el
 * respiro que necesita. Si ademas el footer aportara el suyo, mediria el doble.
 */
export function ListPagination({
  page,
  size,
  total,
  totalPages,
  loading = false,
  onPageChange,
  onSizeChange,
}: ListPaginationProps) {
  // Sin resultados el estado vacio de la tabla ya lo explica todo. Mientras
  // carga si se pinta: si apareciera al llegar las filas, el pie crecerria de
  // golpe y le robaria alto a la tabla que se acaba de dibujar.
  if (total === 0 && !loading) return null

  const desde = total === 0 ? 0 : (page - 1) * size + 1
  const hasta = Math.min(page * size, total)

  const puedeRetroceder = page > 1 && !loading
  const puedeAvanzar = page < totalPages && !loading

  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-center gap-2 p-4">
      <Select
        value={String(size)}
        onValueChange={(valor) => onSizeChange(Number(valor))}
      >
        <SelectTrigger className="w-[80px]" aria-label="Filas por pagina">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TAMANOS_DE_PAGINA.map((opcion) => (
            <SelectItem key={opcion} value={String(opcion)}>
              {opcion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-row items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 rounded-full"
          disabled={!puedeRetroceder}
          aria-label="Primera pagina"
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 rounded-full"
          disabled={!puedeRetroceder}
          aria-label="Pagina anterior"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="px-2 text-sm text-muted-foreground tabular-nums">
          {desde} a {hasta} de {total}
        </span>

        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 rounded-full"
          disabled={!puedeAvanzar}
          aria-label="Pagina siguiente"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 rounded-full"
          disabled={!puedeAvanzar}
          aria-label="Ultima pagina"
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
