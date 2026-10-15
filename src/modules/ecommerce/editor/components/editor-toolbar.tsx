import { useEffect, useRef, useState } from "react"
import { useEditor } from "@craftjs/core"
import {
  Undo2,
  Redo2,
  Eye,
  Pencil,
  MousePointer2,
  Hand,
  SlidersHorizontal,
  Trash2,
  ChevronDown,
  Lock,
  CalendarClock,
} from "lucide-react"
import { ViewportIcon } from "./responsive-field"
import { isTypingTarget } from "./canvas-viewport"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/utils"
import { ButtonGroup } from "@/components/ui/button-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Link } from "react-router-dom"
import { ComponentPermission } from "@/shared/components/component-permission"
import { editorDashboardPath } from "@/modules/ecommerce/editor/lib/editor-channel"
import { useCanvasCamera, type CanvasTool } from "./canvas-camera"
import { VIEWPORT_WIDTHS, type Viewport } from "./viewport-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type PublishState } from "@/modules/ecommerce/editor/lib/editor-store"

/**
 * El estado de publicacion, bajo el nombre de la pagina. Sustituye a la vieja
 * linea de "Guardado hace X min": lo que importa no es cuando se guardo, sino en
 * que estado esta la pagina.
 *
 * El matiz "tiene cambios sin publicar" (`pending`) va como una segunda pastilla
 * pequena sobre Publicada/Privada: se puede estar publicado y con un borrador
 * guardado que el publico todavia no ve.
 */
const ETIQUETAS_PUBLICACION: Record<
  PublishState,
  { texto: string; variant: "secondary" | "outline"; className: string; title: string }
> = {
  published: {
    texto: "Publicada",
    variant: "outline",
    className: "border-green-600/40 text-green-700",
    title: "Vivo para todo el público",
  },
  private: {
    texto: "Privada",
    variant: "outline",
    className: "border-indigo-600/40 text-indigo-700",
    title: "Vivo, pero solo para quien viene del ERP",
  },
  scheduled: {
    texto: "Programada",
    variant: "outline",
    className: "border-amber-600/40 text-amber-700",
    title: "Se publicará sola en su fecha",
  },
  draft: {
    texto: "Borrador",
    variant: "secondary",
    className: "",
    title: "Nunca se publicó: la tienda todavía no la muestra",
  },
  trash: {
    texto: "En papelera",
    variant: "secondary",
    className: "text-muted-foreground",
    title: "En la papelera",
  },
}

function PublishBadge({ state, pending }: { state: PublishState; pending?: boolean }) {
  const etiqueta = ETIQUETAS_PUBLICACION[state]

  return (
    <span className="flex items-center gap-1.5">
      <Badge
        variant={etiqueta.variant}
        className={cn("shrink-0 justify-center font-medium", etiqueta.className)}
        title={etiqueta.title}
      >
        {etiqueta.texto}
      </Badge>
      {pending && (state === "published" || state === "private") && (
        <Badge
          variant="outline"
          className="shrink-0 border-amber-600/40 text-amber-700"
          title="Hay cambios guardados que el público todavía no ve"
        >
          Cambios sin publicar
        </Badge>
      )}
    </span>
  )
}

/**
 * Deja el nombre en texto plano de una sola linea. Al pegar suelen colarse
 * saltos, tabulaciones, espacios duros y caracteres invisibles de ancho cero;
 * aqui se aplanan todos antes de guardar nada.
 */
function normalizarTitulo(texto: string): string {
  return texto
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Inserta texto en la posicion del cursor sin tocar el portapapeles ni el HTML. */
function insertarTextoPlano(texto: string) {
  const seleccion = window.getSelection()
  if (!seleccion || seleccion.rangeCount === 0) return
  const rango = seleccion.getRangeAt(0)
  rango.deleteContents()
  const nodo = document.createTextNode(texto)
  rango.insertNode(nodo)
  rango.setStartAfter(nodo)
  rango.collapse(true)
  seleccion.removeAllRanges()
  seleccion.addRange(rango)
}

/**
 * Herramienta activa del canvas. Con "Mover" el clic solo desplaza la camara: el
 * contenido no recibe el puntero, asi que no se selecciona ni se edita. Lo que ya
 * estuviera seleccionado se conserva, para poder seguir ajustandolo desde el panel.
 */
function ToolSelect() {
  const { tool, setTool } = useCanvasCamera()

  return (
    <Select value={tool} onValueChange={(value) => setTool(value as CanvasTool)}>
      {/* Cerrado basta con el icono: el nombre y el atajo solo hacen falta al
          elegir, y asi la barra no gasta 130px en algo que ya se reconoce. */}
      <SelectTrigger
        className="h-8 w-auto gap-1 px-2 text-[12px]"
        title={tool === "hand" ? "Mover (H)" : "Puntero (V)"}
      >
        {tool === "hand" ? (
          <Hand className="h-3.5 w-3.5" />
        ) : (
          <MousePointer2 className="h-3.5 w-3.5" />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pointer" className="text-[12px]">
          <span className="flex items-center gap-2">
            <MousePointer2 className="h-3.5 w-3.5" />
            Puntero
            <span className="text-foreground/50">V</span>
          </span>
        </SelectItem>
        <SelectItem value="hand" className="text-[12px]">
          <span className="flex items-center gap-2">
            <Hand className="h-3.5 w-3.5" />
            Mover
            <span className="text-foreground/50">H</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

/**
 * Controles de la camara del canvas. El porcentaje vuelve al 100% al pulsarlo,
 * que es el atajo mas pedido y evita meter un menu para cuatro valores.
 */
/**
 * El zoom, en un desplegable. El disparador muestra siempre el porcentaje real
 * y no la opcion elegida: la rueda y Ctrl +/- siguen moviendolo a valores que
 * no estan en la lista, y ahi un "75 %" fijo mentiria.
 */
function ZoomSelect() {
  const { zoom, zoomTo, reset, fit } = useCanvasCamera()

  // Solo se marca una opcion cuando el zoom coincide de verdad con ella; tras
  // "Ajustar a la pantalla" no coincide con ninguna y no se marca nada.
  const seleccionada =
    Math.abs(zoom - 0.5) < 0.005
      ? "50"
      : Math.abs(zoom - 0.75) < 0.005
        ? "75"
        : Math.abs(zoom - 1) < 0.005
          ? "100"
          : ""

  return (
    <Select
      value={seleccionada}
      onValueChange={(valor) => {
        if (valor === "fit") fit()
        else if (valor === "50") zoomTo(0.5)
        else if (valor === "75") zoomTo(0.75)
        // Como el boton de antes y como Ctrl 0: el 100% tambien recentra.
        else reset()
      }}
    >
      <SelectTrigger
        className="h-8 w-auto gap-1 px-2 text-[12px] tabular-nums"
        title="Zoom"
        aria-label="Zoom"
      >
        {Math.round(zoom * 100)}%
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fit" className="text-[12px]">
          Ajustar a la pantalla
        </SelectItem>
        <SelectItem value="50" className="text-[12px]">
          50 %
        </SelectItem>
        <SelectItem value="75" className="text-[12px]">
          75 %
        </SelectItem>
        <SelectItem value="100" className="text-[12px]">
          100 % (tamaño real)
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

/**
 * Deshacer y rehacer.
 *
 * Se renderiza dos veces: junto al nombre en pantallas anchas y dentro del
 * grupo de la derecha cuando ese grupo baja de fila. CSS no puede mover un
 * nodo de un contenedor a otro, asi que la unica salida es pintarlo en los dos
 * sitios y dejar visible el que toca. La copia oculta va con display:none, o
 * sea que tampoco esta en el arbol de accesibilidad ni se puede tabular.
 */
function BotonesHistorial({ className }: { className?: string }) {
  const { actions, canUndo, canRedo } = useEditor((_state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }))

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={!canUndo}
        onClick={() => actions.history.undo()}
        title="Deshacer"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={!canRedo}
        onClick={() => actions.history.redo()}
        title="Rehacer"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface EditorToolbarProps {
  /** Guarda sin publicar. Lo que sirve la tienda no se toca. */
  onSaveDraft: (json: string) => void
  /** Lo del canvas pasa a ser lo que ve el publico. */
  onPublish: (json: string) => void
  /** Publica como privada: vivo, pero solo para quien viene del ERP. */
  onPublishPrivate?: (json: string) => void
  /** Programa: se publica sola en la fecha dada (ISO). */
  onSchedule?: (json: string, scheduledAt: string) => void
  /** Sin esto no se ofrece descartar (p. ej. si la pagina no lo admite). */
  onDiscardDraft?: () => void
  /**
   * Si hay borrador que descartar. No se deduce de `publishState`: una pagina
   * sin publicar sigue marcada como borrador aunque ya no le quede ninguno
   * (justo despues de descartarlo), y ahi el boton no haria nada.
   */
  hasDraft?: boolean
  publishState?: PublishState
  /** Tiene cambios guardados sin publicar (matiz sobre Publicada/Privada). */
  pending?: boolean
  /**
   * Que se esta haciendo contra el servidor, o null si nada. Manda sobre el
   * texto de cada boton y bloquea todos a la vez: dos escrituras cruzadas
   * sobre la misma fila se pisarian.
   */
  savingAction?: "draft" | "publish" | "private" | "schedule" | "discard" | null
  pageTitle?: string
  /** Sin este callback el nombre no se puede editar: se pinta como texto. */
  onPageTitleChange?: (titulo: string) => void
  /** Cuando se guardo por ultima vez, en ISO. Se pinta bajo el nombre. */
  lastEditedAt?: string | null
  /**
   * Si hay algo pendiente de guardar: el canvas, el nombre o —en un modal— su
   * configuracion. De esto depende que "Guardar borrador" este activo.
   *
   * Por defecto true: si alguna vista montara la barra sin pasarlo, es
   * preferible dejar guardar de mas que bloquear el guardado.
   */
  hasUnsavedChanges?: boolean
  isOffline?: boolean
  viewport?: Viewport
  onViewportChange?: (viewport: Viewport) => void
  /** Si el panel de Propiedades esta plegado; el boton de la barra lo alterna. */
  propsCerrado?: boolean
  onAlternarProps?: () => void
  /**
   * Si ya se puede guardar. En false mientras el contenido de la pagina todavia
   * no ha llegado: el canvas esta vacio a proposito y guardarlo sobrescribiria
   * la pagina de verdad con una en blanco.
   */
  canSave?: boolean
}

export function EditorToolbar({ onSaveDraft, onPublish, onPublishPrivate, onSchedule, onDiscardDraft, hasDraft = false, publishState = "draft", pending = false, savingAction = null, pageTitle, onPageTitleChange, viewport = "desktop", onViewportChange, canSave = true, hasUnsavedChanges = true, propsCerrado = false, onAlternarProps }: EditorToolbarProps) {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))

  // Ctrl+Z deshace y Ctrl+Y rehace, los mismos botones de esta barra. En Mac
  // valen con Cmd. Con Shift no hacen nada: Ctrl+Shift+Z suele ser "rehacer"
  // en otros editores y seria confuso que aqui deshiciera.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
      const tecla = e.key.toLowerCase()
      if (tecla !== "z" && tecla !== "y") return
      // No mientras se escribe: dentro de un campo Ctrl+Z es el deshacer del
      // navegador sobre el texto, y el nombre de la pagina que esta aqui al
      // lado es un contenteditable.
      if (isTypingTarget(e.target)) return

      e.preventDefault()
      if (tecla === "y") actions.history.redo()
      else actions.history.undo()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [actions])

  // ── Renombrar la pagina ─────────────────────────────────────────────────
  // Solo cambia el nombre; el slug es el identificador y no se toca desde
  // aqui. El nombre nuevo viaja en el siguiente guardado.
  const [editandoTitulo, setEditandoTitulo] = useState(false)
  const tituloRef = useRef<HTMLSpanElement>(null)
  // Espejo del estado para los handlers: terminar() lo llama tanto el blur
  // como Enter y Escape, y sin esta marca el blur que provoca el propio
  // blur() de dentro volveria a entrar y confirmaria dos veces.
  const editandoRef = useRef(false)

  const puedeRenombrar = Boolean(onPageTitleChange)

  function empezarAEditarTitulo() {
    if (!puedeRenombrar || editandoRef.current) return
    editandoRef.current = true
    setEditandoTitulo(true)
  }

  function terminarDeEditar(guardar: boolean) {
    if (!editandoRef.current) return
    editandoRef.current = false
    setEditandoTitulo(false)

    const el = tituloRef.current
    const limpio = normalizarTitulo(el?.textContent ?? "")

    // Un nombre vacio no vale: al guardar, el titulo caeria al slug.
    if (guardar && limpio && limpio !== pageTitle) {
      onPageTitleChange?.(limpio)
      el?.blur()
      return
    }

    // Cancelado, vacio o sin cambios: hay que devolver el texto original al
    // DOM a mano, porque React no repinta el nodo si pageTitle no cambio.
    if (el) el.textContent = pageTitle ?? ""
    el?.blur()
  }

  useEffect(() => {
    const el = tituloRef.current
    if (!editandoTitulo || !el) return
    el.focus()
    // Todo seleccionado al entrar, para poder reemplazar de una.
    const rango = document.createRange()
    rango.selectNodeContents(el)
    const seleccion = window.getSelection()
    seleccion?.removeAllRanges()
    seleccion?.addRange(rango)
  }, [editandoTitulo])

  const isSaving = savingAction !== null

  const handleSaveDraft = () => {
    if (!canSave) return
    onSaveDraft(query.serialize())
  }

  const handlePublish = () => {
    if (!canSave) return
    onPublish(query.serialize())
  }

  const handlePublishPrivate = () => {
    if (!canSave) return
    onPublishPrivate?.(query.serialize())
  }

  // Programar abre un dialogo con la fecha; al confirmar se manda el lienzo.
  const [programarAbierto, setProgramarAbierto] = useState(false)
  const [fechaProgramada, setFechaProgramada] = useState("")
  const handleSchedule = () => {
    if (!canSave || !fechaProgramada) return
    onSchedule?.(query.serialize(), new Date(fechaProgramada).toISOString())
    setProgramarAbierto(false)
    setFechaProgramada("")
  }

  // Descartar destruye trabajo sin publicar, asi que pasa por confirmacion. El
  // texto cambia segun el estado: si nunca se publico no hay "version anterior"
  // a la que volver, y prometerla seria mentira.
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const puedeDescartar = Boolean(onDiscardDraft) && hasDraft

  return (
    <div className="min-h-14 bg-background border-b border-border flex flex-col px-4 py-2 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Title + navigation */}
      <div className="flex items-center gap-2 py-2">
        {/* El cuadrado y los dos textos, alineados como la cabecera del
            sidebar de NEURA (AppSidebar): icono a la izquierda, las lineas
            apiladas a su derecha y todo centrado entre si. */}
        <div className="flex items-center gap-2">
          {/* Mismo cuadrado, con la inicial en vez del icono. Aqui los tokens
              son los generales y no los --sidebar-*: el editor no monta el
              componente Sidebar. */}
          <Link
            to={editorDashboardPath()}
            title="Volver a mis paginas"
            aria-label="Volver a mis paginas"
            className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            N
          </Link>
          {pageTitle && (
            <div className="grid text-left leading-tight">
              <span
              ref={tituloRef}
              // Se edita en el sitio. "plaintext-only" hace que el navegador
              // ignore el formato al pegar y desactive negrita/cursiva; el
              // onPaste repite el filtro por si el navegador no lo soporta.
              contentEditable={editandoTitulo ? "plaintext-only" : false}
              suppressContentEditableWarning
              role={puedeRenombrar ? "textbox" : undefined}
              tabIndex={puedeRenombrar ? 0 : undefined}
              aria-label={puedeRenombrar ? "Nombre de la pagina" : undefined}
              // Tooltip nativo: con el nombre cortado por el truncate, el
              // atributo title es lo que deja leerlo entero al pasar encima.
              title={editandoTitulo ? undefined : pageTitle}
              onClick={empezarAEditarTitulo}
              onBlur={() => terminarDeEditar(true)}
              onPaste={(e) => {
                e.preventDefault()
                const plano = normalizarTitulo(
                  e.clipboardData.getData("text/plain")
                )
                if (plano) insertarTextoPlano(plano)
              }}
              // Arrastrar y soltar es la otra via por la que entra HTML.
              onDrop={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (!editandoTitulo) {
                  if (e.key === "Enter" || e.key === "F2") {
                    e.preventDefault()
                    empezarAEditarTitulo()
                  }
                  return
                }
                if (e.key === "Enter") {
                  e.preventDefault()
                  terminarDeEditar(true)
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  terminarDeEditar(false)
                } else if (
                  (e.ctrlKey || e.metaKey) &&
                  ["b", "i", "u"].includes(e.key.toLowerCase())
                ) {
                  // Sin plaintext-only estos atajos si aplicarian formato.
                  e.preventDefault()
                }
              }}
              className={
                editandoTitulo
                  ? "w-[100px] shrink-0 overflow-x-auto whitespace-nowrap rounded px-1 text-sm text-foreground outline-none ring-1 ring-primary [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  : puedeRenombrar
                    ? "w-[100px] shrink-0 truncate cursor-text rounded px-1 text-sm text-foreground hover:bg-muted"
                    : "w-[100px] shrink-0 truncate px-1 text-sm text-foreground"
              }
            >
                {pageTitle}
              </span>
              {/* En vez de "Guardado hace X min": en que estado esta la pagina.
                  El matiz "sin publicar" va dentro del propio badge. */}
              <div className="pt-0.5">
                <PublishBadge state={publishState} pending={pending} />
              </div>
            </div>
          )}
        </div>
        {/* Separador con las flechas. Cuando ellas bajan al grupo de abajo
            no separa nada, asi que se va con ellas. */}
        {pageTitle && (
          <span className="hidden text-muted-foreground lg:inline">|</span>
        )}
        {/* En una sola fila van con el nombre: son acciones sobre la pagina,
            no sobre como se la mira. */}
        <BotonesHistorial className="hidden lg:flex" />
      </div>

      {/* Derecha: modo de pantalla, herramienta, zoom y guardado.

          Bajo lg baja a su propia fila y rueda en horizontal; desde lg vuelve
          a la linea y el justify-between lo empuja contra el borde. El corte
          es lg y no md porque los dos grupos suman ~750px y md son 768: ahi ya
          se tocarian.

          La barra horizontal se pasa como hijo, que es el patron de shadcn:
          nuestro ScrollArea trae una vertical fija y no acepta orientation.
          Funciona porque Radix las posiciona absolutas contra el Root, no
          contra el viewport, asi que no se van con el scroll. */}
      <ScrollArea className="w-full lg:w-auto" thumbClassName="bg-primary">
        {/* w-max: sin el, el div de dentro del viewport es de bloque, se
            queda al ancho del hueco y nunca desbordaria, con lo que no
            habria nada que rodar. pb-2.5 deja sitio a la barra para que no
            tape los botones. */}
        <div className="flex w-max items-center gap-3 py-2 pb-2.5 lg:pb-2">
          {/* Con el grupo abajo, las flechas se vienen aqui: en su fila de
              arriba se quedarian solas y descolgadas del resto. */}
          <BotonesHistorial className="lg:hidden" />
        {/* Los tres modos van unidos como un solo control: ButtonGroup les
            quita el radio y el borde de en medio. El inactivo pasa de "ghost"
            a "outline" porque sin borde no habria nada que unir; el activo se
            queda en "secondary", que en este proyecto ya trae su propio borde.
            aria-pressed porque funcionan como un grupo de eleccion, no como
            tres botones sueltos. */}
        <ButtonGroup>
          <Button
            variant={viewport === "desktop" ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            aria-pressed={viewport === "desktop"}
            title={`Escritorio (${VIEWPORT_WIDTHS.desktop}px)`}
            onClick={() => onViewportChange?.("desktop")}
          >
            <ViewportIcon viewport="desktop" className="h-4 w-4" />
          </Button>
          <Button
            variant={viewport === "tablet" ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            aria-pressed={viewport === "tablet"}
            title={`Tableta (${VIEWPORT_WIDTHS.tablet}px)`}
            onClick={() => onViewportChange?.("tablet")}
          >
            <ViewportIcon viewport="tablet" className="h-4 w-4" />
          </Button>
          <Button
            variant={viewport === "mobile" ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            aria-pressed={viewport === "mobile"}
            title={`Celular (${VIEWPORT_WIDTHS.mobile}px)`}
            onClick={() => onViewportChange?.("mobile")}
          >
            <ViewportIcon viewport="mobile" className="h-4 w-4" />
          </Button>
        </ButtonGroup>

        <ToolSelect />

        <ZoomSelect />

        {/* Pliega el panel de Propiedades. Va en la barra y no sobre el lienzo
            porque ahi tapaba la barra de scroll. Marcado mientras el panel
            esta abierto, como los modos de pantalla. */}
        {onAlternarProps && (
          <Button
            variant={propsCerrado ? "outline" : "secondary"}
            size="icon"
            className="h-8 w-8"
            aria-pressed={!propsCerrado}
            title={propsCerrado ? "Mostrar propiedades" : "Ocultar propiedades"}
            aria-label={propsCerrado ? "Mostrar propiedades" : "Ocultar propiedades"}
            onClick={onAlternarProps}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Solo icono: el icono cambia con el modo y el nombre lo da el
            tooltip nativo, igual que el resto de botones de la barra. */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          title={enabled ? "Vista previa" : "Volver a editar"}
          aria-label={enabled ? "Vista previa" : "Volver a editar"}
          onClick={() =>
            actions.setOptions((options) => {
              options.enabled = !enabled
            })
          }
        >
          {enabled ? (
            <Eye className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>

        {/* Tirar el borrador solo tiene sentido si lo hay; con todo publicado
            no habria nada que descartar. */}
        {puedeDescartar && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-destructive"
            onClick={() => setConfirmarDescarte(true)}
            disabled={isSaving || !canSave}
            title="Descartar el borrador"
            aria-label="Descartar el borrador"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {/* Anchos fijos (w-40 = 160px, w-32 = 128px): el texto de trabajo es
            mas largo que el de reposo y sin esto los botones se encogerian al
            terminar, moviendo la fila entera. */}
        {/* Sin cambios no hay borrador que guardar: guardarlo solo reescribiria
            lo mismo y dejaria la pagina marcada como "con cambios sin
            publicar" sin haber cambiado nada. Publicar si sigue disponible:
            publicar un borrador que ya estaba guardado es una accion real. */}
        <Button
          variant="outline"
          size="sm"
          className="w-40 shrink-0"
          onClick={handleSaveDraft}
          disabled={isSaving || !canSave || !hasUnsavedChanges}
          title={
            !canSave
              ? "Esperando el contenido de la página"
              : hasUnsavedChanges
                ? "Guarda los cambios sin publicarlos"
                : "No hay cambios que guardar"
          }
        >
          {savingAction === "draft" ? "Guardando..." : "Guardar borrador"}
        </Button>

        {/* ERP: publicar (y privada/programada) pide ecommerce_editor.publish.
            Quien solo tiene .edit guarda borradores; el backend lo exige igual. */}
        <ComponentPermission codeIn={["ecommerce_editor.publish"]}>
          {/* Publicar unificado: el boton publica al publico y el desplegable de
              al lado ofrece las otras dos formas de publicar (privada y
              programada), sin sumar mas botones a la fila. */}
          <ButtonGroup className="shrink-0">
            <Button
              size="sm"
              className="w-32"
              onClick={handlePublish}
              disabled={isSaving || !canSave}
              title={
                canSave
                  ? "Publica lo que hay en pantalla: pasa a verlo el público"
                  : "Esperando el contenido de la página"
              }
            >
              {savingAction === "publish"
                ? "Publicando..."
                : savingAction === "private"
                  ? "Guardando..."
                  : savingAction === "schedule"
                    ? "Programando..."
                    : "Publicar"}
            </Button>
            {(onPublishPrivate || onSchedule) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    className="h-9 w-8"
                    disabled={isSaving || !canSave}
                    title="Otras formas de publicar"
                    aria-label="Otras formas de publicar"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {onPublishPrivate && (
                    <DropdownMenuItem onClick={handlePublishPrivate}>
                      <Lock className="mr-2 h-4 w-4" />
                      Publicar como privada
                    </DropdownMenuItem>
                  )}
                  {onSchedule && (
                    <DropdownMenuItem onClick={() => setProgramarAbierto(true)}>
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Programar…
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ButtonGroup>
        </ComponentPermission>
        </div>
        {/* El thumbClassName va aparte: esta barra la monta el toolbar, no el
            ScrollArea, asi que no le llega el suyo. */}
        <ScrollBar orientation="horizontal" thumbClassName="bg-primary" />
      </ScrollArea>

      {/* Fuera del ScrollArea: su contenido se pinta en un portal, pero dentro
          del area que rueda no pinta nada util y si estorba al medir el ancho. */}
      <AlertDialog open={confirmarDescarte} onOpenChange={setConfirmarDescarte}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar el borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              {publishState === "draft"
                ? "Esta página nunca se publicó, así que se perderá todo su contenido y quedará vacía. Esto no se puede deshacer."
                : "Se perderán los cambios que guardaste sin publicar y volverás a la última versión publicada. Esto no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDiscardDraft?.()}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={programarAbierto} onOpenChange={setProgramarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar publicación</DialogTitle>
            <DialogDescription>
              Lo que hay en pantalla se publicará solo en la fecha y hora que
              elijas. Hasta entonces no se ve en el sitio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="fecha-programada-editor">Fecha y hora</Label>
            <Input
              id="fecha-programada-editor"
              type="datetime-local"
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramarAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSchedule} disabled={!fechaProgramada || !canSave}>
              Programar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}