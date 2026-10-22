import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ComponentPermission } from "@/shared/components/component-permission"
import { editorPagePath } from "@/modules/ecommerce/editor/lib/editor-channel"
import { toast } from "sonner"
import {
  AlertTriangle,
  CalendarClock,
  EyeOff,
  Loader2,
  Lock,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  SquarePen,
  Trash,
  Upload,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  publishStoredResult,
  publishPrivateResult,
  schedulePageResult,
  unpublishPageResult,
  trashPageResult,
  restorePageResult,
  softDeletePageResult,
  resolvePublishState,
  type StoreResult,
  type VisualEditListItem,
  type VisualEditRecord,
} from "@/modules/ecommerce/editor/lib/editor-store"
import { PublishBadge } from "./publish-badge"

/** Cada cuanto se recalcula el reloj, para que una programada vencida pase sola
 *  a "Publicada" sin recargar. */
const REFRESCO_MS = 60 * 1000

type AccionFila =
  | "publish"
  | "private"
  | "schedule"
  | "unpublish"
  | "trash"
  | "restore"
  | "soft_delete"

/** Una confirmacion pendiente para las acciones que destruyen o sacan del aire. */
type Confirmacion = {
  item: VisualEditListItem
  accion: "unpublish" | "trash" | "soft_delete"
}

function mensajeDeFallo(
  result: Extract<StoreResult<unknown>, { ok: false }>,
  base: string
): string {
  if (result.reason === "unauthorized") return `${base}: la sesión expiró`
  if (result.status === 0) return `${base}: sin conexión`
  return base
}

/** El texto de la confirmacion, segun la accion y el tipo de fila. */
function textoConfirmacion(c: Confirmacion): { titulo: string; cuerpo: string; boton: string } {
  if (c.accion === "unpublish") {
    return {
      titulo: `¿Despublicar "${c.item.title}"?`,
      cuerpo:
        "Dejará de verse en el sitio. El contenido se conserva: al volver a publicarla aparece tal cual estaba.",
      boton: "Despublicar",
    }
  }
  if (c.accion === "trash") {
    return {
      titulo: `¿Enviar "${c.item.title}" a la papelera?`,
      cuerpo:
        "Saldrá del sitio y de este listado. Podrás restaurarla o eliminarla desde la papelera.",
      boton: "Enviar a papelera",
    }
  }
  return {
    titulo: `¿Eliminar "${c.item.title}"?`,
    cuerpo:
      "Desaparecerá de la papelera. No se podrá volver a abrir desde aquí.",
    boton: "Eliminar",
  }
}

/** Las columnas de la tabla, para el colSpan de las filas de estado. */
const COLUMNAS = 4

function FilaDeEstado({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <TableRow className={cn("hover:bg-transparent", className)}>
      <TableCell colSpan={COLUMNAS} className="p-0">
        {children}
      </TableCell>
    </TableRow>
  )
}

function FilaEsqueleto() {
  return (
    <TableRow aria-hidden>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24 rounded-full" />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-10 rounded-md" />
          <Skeleton className="h-9 w-10 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}

export function SectionTable({
  items,
  icon: Icon,
  slugPrefix,
  onChanged,
  loading,
  error,
  onRetry,
  skeletonRows,
  emptyTitle,
  emptyText,
  emptyAction,
  trashView = false,
}: {
  items: VisualEditListItem[]
  icon: LucideIcon
  slugPrefix: string
  onChanged: () => void
  loading: boolean
  error: boolean
  onRetry: () => void
  skeletonRows: number
  emptyTitle: string
  emptyText: string
  emptyAction?: React.ReactNode
  /** La vista de papelera cambia las acciones a Restaurar / Eliminar. */
  trashView?: boolean
}) {
  const [ahora, setAhora] = useState(0)
  useEffect(() => {
    setAhora(Date.now())
    const reloj = window.setInterval(() => setAhora(Date.now()), REFRESCO_MS)
    return () => window.clearInterval(reloj)
  }, [])

  const [navegandoA, setNavegandoA] = useState<string | null>(null)
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) setNavegandoA(null)
    }
    window.addEventListener("pageshow", restore)
    return () => window.removeEventListener("pageshow", restore)
  }, [])

  const [ocupada, setOcupada] = useState<{ slug: string; accion: AccionFila } | null>(
    null
  )
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)
  // La fila para la que se esta eligiendo fecha de programacion.
  const [programando, setProgramando] = useState<VisualEditListItem | null>(null)
  const [fechaProgramada, setFechaProgramada] = useState("")

  async function ejecutar(
    item: VisualEditListItem,
    accion: AccionFila,
    fn: () => Promise<StoreResult<unknown>>,
    exito: string,
    baseFallo: string
  ) {
    setOcupada({ slug: item.slug, accion })
    try {
      const result = await fn()
      // === true: el ERP compila sin strictNullChecks (ver editor-store).
      if (result.ok === true) {
        toast.success(exito)
        onChanged()
      } else {
        toast.error(mensajeDeFallo(result, baseFallo))
      }
    } finally {
      setOcupada(null)
    }
  }

  const publicar = (item: VisualEditListItem) =>
    ejecutar(
      item,
      "publish",
      () => publishStoredResult(item.slug, item.title, item.type),
      `"${item.title}" ya está publicada`,
      "No se pudo publicar"
    )

  const hacerPrivada = (item: VisualEditListItem) =>
    ejecutar(
      item,
      "private",
      () => publishPrivateResult(item.slug, item.title, item.type),
      `"${item.title}" ahora es privada`,
      "No se pudo hacer privada"
    )

  const despublicar = (item: VisualEditListItem) =>
    ejecutar(
      item,
      "unpublish",
      () => unpublishPageResult(item.slug, item.title, item.type),
      `"${item.title}" ya no se ve en el sitio`,
      "No se pudo despublicar"
    )

  const enviarAPapelera = (item: VisualEditListItem) =>
    ejecutar(
      item,
      "trash",
      () => trashPageResult(item.slug, item.title, item.type),
      `"${item.title}" está en la papelera`,
      "No se pudo enviar a la papelera"
    )

  const restaurar = (item: VisualEditListItem) =>
    ejecutar(
      item,
      "restore",
      () => restorePageResult(item.slug, item.title, item.type),
      `"${item.title}" restaurada como borrador`,
      "No se pudo restaurar"
    )

  const eliminar = (item: VisualEditListItem) =>
    ejecutar(
      item,
      "soft_delete",
      () => softDeletePageResult(item.slug, item.title, item.type),
      `"${item.title}" eliminada`,
      "No se pudo eliminar"
    )

  function confirmar() {
    if (!confirmacion) return
    const { item, accion } = confirmacion
    setConfirmacion(null)
    if (accion === "unpublish") despublicar(item)
    else if (accion === "trash") enviarAPapelera(item)
    else eliminar(item)
  }

  function abrirProgramar(item: VisualEditListItem) {
    setProgramando(item)
    setFechaProgramada("")
  }

  function confirmarProgramar() {
    if (!programando || !fechaProgramada) return
    const item = programando
    const iso = new Date(fechaProgramada).toISOString()
    setProgramando(null)
    ejecutar(
      item,
      "schedule",
      () => schedulePageResult(item.slug, item.title, item.type, iso),
      `"${item.title}" se publicará en la fecha indicada`,
      "No se pudo programar"
    )
  }

  return (
    <>
      {/* El contenedor de <Table> ya desplaza en las dos direcciones dentro de
          la Card; min-w-[680px] es lo que hace aparecer la barra horizontal
          cuando la tabla no cabe (en celular o con la ventana estrecha). */}
      <Table aria-busy={loading} className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="w-[150px]">Estado</TableHead>
            <TableHead className="w-[170px]">Cambios</TableHead>
            <TableHead className="w-[150px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {error ? (
            <FilaDeEstado className="bg-destructive/5">
              <div className="flex flex-col items-center gap-3.5 px-5 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-destructive-soft text-destructive-soft-foreground">
                  <AlertTriangle className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-semibold text-destructive">
                    No se pudieron cargar los datos
                  </p>
                  <p className="mt-1 max-w-[420px] text-sm text-muted-foreground">
                    Puede ser un corte de conexión o que la sesión haya
                    caducado. No se ha perdido nada: vuelve a intentarlo.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-1" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            </FilaDeEstado>
          ) : loading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <FilaEsqueleto key={i} />
            ))
          ) : items.length === 0 ? (
            <FilaDeEstado>
              <div className="flex flex-col items-center gap-3.5 px-5 py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="h-[26px] w-[26px]" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {emptyTitle}
                </h3>
                <p className="max-w-[420px] text-muted-foreground">
                  {emptyText}
                </p>
                {emptyAction && <div className="mt-1">{emptyAction}</div>}
              </div>
            </FilaDeEstado>
          ) : (
            items.map((item) => {
              const estado = resolvePublishState(
                { status: item.status, scheduled_at: item.scheduled_at, has_draft: item.has_draft },
                ahora
              )
              const trabajando = ocupada?.slug === item.slug
              const abriendo = navegandoA === item.slug
              const isBlock = item.type === "block"
              const isPage = item.type === "page" || item.type === "home"
              const pending = Boolean(item.has_draft)

              // Que ofrece el menu segun el estado (fuera de la papelera).
              const puedePublicar = estado !== "published" || pending
              const puedePrivada = isPage && estado !== "private"
              const puedeProgramar = isPage && estado !== "scheduled"
              const puedeDespublicar =
                !isBlock &&
                (estado === "published" || estado === "private" || estado === "scheduled")
              const puedePapelera = !isBlock
              const hayMenu =
                puedePublicar ||
                puedePrivada ||
                puedeProgramar ||
                puedeDespublicar ||
                puedePapelera

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">
                          {item.title}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {slugPrefix}
                          {item.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <PublishBadge state={estado} scheduledAt={item.scheduled_at} />
                  </TableCell>

                  {/* Columna aparte: el matiz "tiene cambios sin publicar"
                      no es el estado de la fila, es si el borrador difiere de
                      lo publicado. Solo aplica sobre algo vivo. */}
                  <TableCell>
                    {pending && (estado === "published" || estado === "private") ? (
                      <Badge
                        variant="warning"
                        title="Hay cambios guardados que el público todavía no ve"
                      >
                        Sin publicar
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {trashView ? (
                        <ComponentPermission codeIn={["ecommerce_editor.publish"]}>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={trabajando}
                            onClick={() => restaurar(item)}
                          >
                            {trabajando && ocupada?.accion === "restore" ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="mr-1.5 h-4 w-4" />
                            )}
                            Restaurar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={trabajando}
                            title={`Eliminar "${item.title}"`}
                            onClick={() =>
                              setConfirmacion({ item, accion: "soft_delete" })
                            }
                          >
                            {trabajando && ocupada?.accion === "soft_delete" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </ComponentPermission>
                      ) : (
                        <>
                          {/* ERP: abrir el editor pide .edit; el menú de
                              publicar/despublicar/papelera, .publish. */}
                          <ComponentPermission codeIn={["ecommerce_editor.edit"]}>
                          <Button
                            variant="outline"
                            size="sm"
                            title={`Editar "${item.title}"`}
                            asChild
                          >
                            <Link
                              to={editorPagePath(item.slug)}
                              onClick={() => setNavegandoA(item.slug)}
                              aria-busy={abriendo}
                            >
                              {abriendo ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SquarePen className="h-4 w-4" />
                              )}
                            </Link>
                          </Button>
                          </ComponentPermission>

                          <ComponentPermission codeIn={["ecommerce_editor.publish"]}>
                          {hayMenu && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={trabajando}
                                  title="Más acciones"
                                  aria-label="Más acciones"
                                >
                                  {trabajando ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {puedePublicar && (
                                  <DropdownMenuItem onClick={() => publicar(item)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {pending && estado !== "draft"
                                      ? "Publicar cambios"
                                      : "Publicar"}
                                  </DropdownMenuItem>
                                )}
                                {puedePrivada && (
                                  <DropdownMenuItem onClick={() => hacerPrivada(item)}>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Hacer privada
                                  </DropdownMenuItem>
                                )}
                                {puedeProgramar && (
                                  <DropdownMenuItem onClick={() => abrirProgramar(item)}>
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                    Programar…
                                  </DropdownMenuItem>
                                )}
                                {(puedeDespublicar || puedePapelera) &&
                                  (puedePublicar || puedePrivada || puedeProgramar) && (
                                    <DropdownMenuSeparator />
                                  )}
                                {puedeDespublicar && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setConfirmacion({ item, accion: "unpublish" })
                                    }
                                  >
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Despublicar
                                  </DropdownMenuItem>
                                )}
                                {puedePapelera && (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setConfirmacion({ item, accion: "trash" })
                                    }
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Enviar a papelera
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          </ComponentPermission>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={confirmacion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setConfirmacion(null)
        }}
      >
        <AlertDialogContent>
          {confirmacion && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{textoConfirmacion(confirmacion).titulo}</AlertDialogTitle>
                <AlertDialogDescription>
                  {textoConfirmacion(confirmacion).cuerpo}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className={cn(
                    (confirmacion.accion === "trash" ||
                      confirmacion.accion === "soft_delete") &&
                      "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  )}
                  onClick={confirmar}
                >
                  {textoConfirmacion(confirmacion).boton}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={programando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setProgramando(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar publicación</DialogTitle>
            <DialogDescription>
              {programando
                ? `"${programando.title}" se publicará sola en la fecha y hora que elijas. Hasta entonces no se ve en el sitio.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="fecha-programada">Fecha y hora</Label>
            <Input
              id="fecha-programada"
              type="datetime-local"
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramando(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarProgramar} disabled={!fechaProgramada}>
              Programar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
