import { Search } from "lucide-react"

import { CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type StatusFilter } from "@/modules/ecommerce/editor/hooks/use-paged-visual-edits"
import { type StatusCounts } from "@/modules/ecommerce/editor/lib/editor-store"

const PESTANAS: { valor: StatusFilter; texto: string; clave: keyof StatusCounts }[] = [
  { valor: "all", texto: "Todos", clave: "all" },
  { valor: "published", texto: "Publicados", clave: "published" },
  { valor: "draft", texto: "Borradores", clave: "draft" },
]

/**
 * Filtro de estado y buscador.
 *
 * Es la cabecera de la Card del listado: se monta el propio CardHeader aqui
 * dentro para que, cuando la pantalla decide no pintar filtros, no quede una
 * cabecera vacia ocupando sitio sobre la tabla.
 *
 * El filtro son `Tabs` y no un grupo de radios hecho a mano: es el mismo
 * conmutador que el de Recibidas/Enviadas del ERP, y el primitivo ya trae el
 * recorrido con las flechas del teclado y los roles de accesibilidad.
 *
 * Los conteos de las pestanas vienen del servidor e ignoran el estado
 * seleccionado: cada una dice cuantas filas veria si se la marcase, que es lo
 * unico util. Si se calcularan sobre lo que ya esta filtrado, "Borradores" diria
 * siempre lo mismo que "Todos".
 */
export function SectionToolbar({
  status,
  onStatusChange,
  counts,
  search,
  onSearchChange,
  searchPlaceholder,
  loading,
  hideStatus = false,
}: {
  status: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  counts: StatusCounts
  search: string
  onSearchChange: (search: string) => void
  searchPlaceholder: string
  /** Con los conteos en vuelo los numeros son los de la peticion anterior. */
  loading?: boolean
  /** En la papelera las pestanas de estado no aplican: solo queda el buscador. */
  hideStatus?: boolean
}) {
  return (
    // space-y-0 anula el espaciado vertical del CardHeader, que aqui es una fila.
    <CardHeader className="!p-4 flex flex-row flex-wrap items-center gap-2 space-y-0">
      {!hideStatus && (
        <Tabs
          value={status}
          onValueChange={(valor) => onStatusChange(valor as StatusFilter)}
        >
          <TabsList>
            {PESTANAS.map((pestana) => (
              <TabsTrigger key={pestana.valor} value={pestana.valor} className="gap-2">
                {pestana.texto}
                {/* Tapado mientras carga: el numero viejo, junto a una tabla que
                    ya esta pintando esqueletos, se lee como si fuera el nuevo. El
                    hueco mide lo mismo para que las pestanas no cambien de ancho
                    al llegar la respuesta. */}
                {loading ? (
                  <Skeleton className="h-3 w-3.5" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {counts[pestana.clave]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Aqui no hay modal de filtros como en el ERP: lo unico que se filtra es
          el estado, que ya esta en las pestanas, y el texto. El buscador se
          queda a la vista, al otro extremo de la misma fila. */}
      <div className="relative ml-auto w-full sm:w-[280px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="pl-9"
        />
      </div>
    </CardHeader>
  )
}
