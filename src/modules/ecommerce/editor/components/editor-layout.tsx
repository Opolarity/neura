import { useState, useCallback, useRef, useEffect, useMemo, useId, type ReactNode } from "react"
import { toast } from "sonner"
import { assertResolverCompleto } from "@/modules/ecommerce/editor/lib/craft-resolver-check"
import { cn } from "@/shared/utils/utils"
import {
  Editor,
  Frame,
  Element,
  DefaultEventHandlers,
  ROOT_NODE,
  useEditor,
} from "@craftjs/core"
import { EditorToolbar } from "./editor-toolbar"
import {
  SessionController,
  type CraftQueryLike,
  type SaveOutcome,
  type SessionControllerHandle,
} from "./session-controller"
import { EditorSidebar, defaultComponents } from "./editor-sidebar"
import { SettingsPanel } from "./settings-panel"
import { useIsMobile } from "@/modules/ecommerce/editor/hooks/use-mobile"
import { EditableImage } from "./user-components/editable-image"
import { EditableHero } from "./user-components/editable-hero"
import { EditableCarousel } from "./user-components/editable-carousel"
import { EditableContainer } from "./user-components/editable-container"
import { EditableCardCarousel } from "./user-components/editable-card-carousel"
import { EditableContainerCarousel } from "./user-components/editable-container-carousel"
import { EditableButton } from "./user-components/editable-button"
import { EditableIcon } from "./user-components/editable-icon"
import { EditableVideo } from "./user-components/editable-video"
import { EditablePromotionalText } from "./user-components/editable-promotional-text"
import { EditableImageCarousel } from "./user-components/editable-image-carousel"
import { EditableProductGrid } from "./user-components/editable-product-grid"
import { EditableProductCarousel } from "./user-components/editable-product-carousel"
import { EditableCategoryGrid } from "./user-components/editable-category-grid"
import { EditableBenefits } from "./user-components/editable-benefits"
import { EditableTestimonials } from "./user-components/editable-testimonials"
import { EditableFAQ } from "./user-components/editable-faq"
import { EditableMegaMenu } from "./user-components/editable-mega-menu"
import { EditableRichText } from "./user-components/editable-rich-text"
import { EditableNestedLinks } from "./user-components/editable-nested-links"
import { EditableDropdownButton } from "./user-components/editable-dropdown-button"
import { EditableHoverableDropdown } from "./user-components/editable-hoverable-dropdown"
import { EditableProductPopover } from "./user-components/editable-product-popover"
import { EditableCart } from "./user-components/editable-cart"
import EditableAccount from "./user-components/editable-account"
import { EditableSearch } from "./user-components/editable-search"
import { EditableGoogleReviews } from "./user-components/editable-google-reviews"
import { EditableCategoryCarousel } from "./user-components/editable-category-carousel"
import { Layers } from "@craftjs/layers"
import { CustomLayer } from "./custom-layer"
import { LayersSelectionProvider, useLayersSelection } from "./layers-selection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { ModalConfigPanel } from "./modal-config-panel"
import { type ModalConfig, type PublishState } from "@/modules/ecommerce/editor/lib/editor-store"
import {
  POPUP_SHADOWS,
  overlayColorOf,
  presentationFor,
  sideFor,
  surfaceCss,
} from "@/modules/ecommerce/editor/lib/popup-presets"
import { positionClass } from "@/modules/ecommerce/editor/tienda/modal-provider"
import { ViewportContext, VIEWPORT_WIDTHS, type Viewport } from "./viewport-context"
import { CanvasCameraProvider } from "./canvas-camera"
import { CanvasViewport, CanvasPage } from "./canvas-viewport"

const resolver = {
  EditableImage,
  EditableHero,
  EditableCarousel,
  EditableContainer,
  EditableCardCarousel,
  EditableContainerCarousel,
  EditableButton,
  EditableIcon,
  EditableVideo,
  EditablePromotionalText,
  EditableImageCarousel,
  EditableProductGrid,
  EditableProductCarousel,
  EditableCategoryGrid,
  EditableBenefits,
  EditableTestimonials,
  EditableFAQ,
  EditableMegaMenu,
  EditableRichText,
  EditableNestedLinks,
  EditableDropdownButton,
  EditableHoverableDropdown,
  EditableProductPopover,
  EditableCart,
  EditableAccount,
  EditableSearch,
  EditableGoogleReviews,
  EditableCategoryCarousel,
}

// El contenedor del arbol se registra en el contexto: de su orden en el DOM
// sale el orden visual con el que shift resuelve un rango de capas.
// Los topes del panel de Componentes|Capas, en pixeles. react-resizable-panels
// solo entiende porcentajes (quito las unidades en px en su v2), asi que se
// convierten midiendo la fila; por eso hace falta el ResizeObserver.
const PANEL_IZQ_MIN_PX = 240
const PANEL_IZQ_MAX_PX = 340
// Propiedades usa los mismos topes; arranca en su ancho de siempre (w-72).
const PANEL_DER_DEFAULT_PX = 288

/**
 * El aviso de que todavia se espera el contenido.
 *
 * No tapa nada: va sin puntero por encima del canvas, que se ve y se recorre con
 * normalidad desde el primer momento. Lo unico apagado es el contenido.
 *
 *   "visible"  -> esperando
 *   "saliendo" -> fundido en curso
 *   "fuera"    -> desmontado
 */
type EstadoAviso = "visible" | "saliendo" | "fuera"

/** Duracion del fundido. Tiene que coincidir con la clase duration-* de abajo. */
const MS_FUNDIDO = 200

/**
 * Alto de la pagina mientras no hay contenido. El ancho lo da el modo de
 * pantalla y se sabe desde el primer frame; el alto es lo unico que aporta el
 * contenido, y sin esto el lienzo vacio mide lo que mida el contenedor (60px de
 * minimo mas su padding) y parece roto en vez de vacio.
 *
 * Solo es un minimo y solo mientras carga: al llegar el contenido manda el
 * contenido, sea mas alto o mas bajo.
 */
const ALTO_PAGINA_CARGANDO = 900

/**
 * El alto de la pantalla simulada detras de un popup, por modo: lo que ocupa
 * una ventana tipica en cada uno. Es contra lo que se miden el panel lateral o
 * la pantalla completa, que ocupan todo el alto.
 */
const ALTO_ESCENARIO_POPUP: Record<Viewport, number> = {
  desktop: 820,
  tablet: 1024,
  mobile: 780,
}

/**
 * El marco del popup en el lienzo, con las mismas reglas que en la tienda para
 * el modo que se esta viendo (ver lib/popup-presets.ts). Sin config es un div
 * con `display: contents`, y no un Fragment: si el tipo de elemento cambiara al
 * saberse que la pagina es un modal, React remontaria el <Frame> de dentro.
 */
function PopupCanvasFrame({
  config,
  viewport,
  children,
}: {
  config: ModalConfig | undefined
  viewport: Viewport
  children: ReactNode
}) {
  const id = useId().replace(/:/g, "")
  if (!config) {
    return <div className="contents">{children}</div>
  }

  const surfaceClass = `popup-preview-${id}`
  const presentation = presentationFor(config, viewport)
  const conFondo = config.overlay && presentation !== "fullscreen"

  return (
    <div className="contents">
      <style>{surfaceCss(config, surfaceClass, `${surfaceClass}-video`, viewport)}</style>
      {conFondo && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: overlayColorOf(config) }}
        />
      )}
      <div
        className={cn(
          "absolute z-10 isolate flex flex-col overflow-hidden",
          positionClass(presentation, sideFor(config, viewport)),
          surfaceClass,
          (config.style.customClass as string | undefined) ?? ""
        )}
        style={{ boxShadow: POPUP_SHADOWS[config.shadow].css }}
      >
        {config.showCloseButton && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground/70 shadow-sm"
          >
            <X className="h-4 w-4" />
          </span>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

/**
 * Mete el contenido de la pagina en el canvas cuando llega.
 *
 * El editor se monta antes que el contenido, asi que <Frame> arranca con un
 * contenedor vacio y lo de verdad entra por aqui. <Frame> no sirve para esto:
 * carga una sola vez al montarse y sus props estan memoizados, asi que cambiarle
 * el contenido despues no hace nada. La via es `deserialize` via useEditor, que
 * es justo lo que documenta craft para el caso.
 *
 * Y va en un efecto, no remontando <Frame> con otra key, por una razon concreta:
 * <Frame> carga DURANTE el render. Al montar no pasa nada porque todavia no hay
 * nadie suscrito al estado, pero hacerlo mas tarde dispararia los `setState` de
 * los suscriptores de craft (Capas, Propiedades, la barra) en mitad del render
 * de otro componente. Desde un efecto no hay tal cosa.
 *
 * Carga una sola vez, asi que para recargar el canvas hay que remontarlo: eso
 * hace la key con `contentVersion` al descartar un borrador. Se remonta esto y
 * no el editor entero, que ademas se llevaria por delante los paneles, el zoom
 * y el modo de pantalla, que no tienen nada que ver con el contenido.
 */
function ContentLoader({
  json,
  isModal,
  loaded,
  restaurado,
  sessionRef,
  onPainted,
}: {
  json?: string
  isModal?: boolean
  loaded: boolean
  /**
   * Si lo que entra es el respaldo local y no lo que hay en el servidor. Ese
   * contenido nace pendiente de guardar: es trabajo que nunca llego a
   * escribirse, asi que no se puede tomar como punto de partida.
   */
  restaurado?: boolean
  sessionRef: React.MutableRefObject<SessionControllerHandle | null>
  /**
   * Se llama cuando el contenido ya se pinto, no cuando se empezo a deserializar.
   * deserialize reemplaza el arbol entero y craft lo repinta despues; el aviso de
   * "Cargando" se tiene que ir con el repintado, no antes, o queda un instante con
   * el canvas vacio (las Capas ya se ven porque su suscripcion es mas ligera).
   */
  onPainted?: () => void
}) {
  const { actions, query } = useEditor()
  const yaCargado = useRef(false)
  const pintadoRaf = useRef<number | null>(null)

  useEffect(() => {
    if (!loaded || yaCargado.current) return
    yaCargado.current = true

    if (json) {
      // history.ignore: abrir una pagina no es un paso que se pueda deshacer.
      // Y deserialize reemplaza el arbol entero, asi que del canvas provisional
      // no queda nada.
      actions.history.ignore().deserialize(json)
    } else {
      // Pagina o modal sin contenido: el contenido de arranque. Va aqui y no en
      // los children de <Frame> porque al montar todavia no se sabe si es un
      // modal, y los dos arrancan distinto (texto, tamaño y el nombre que se lee
      // en Capas).
      //
      // addNodeTree sobrescribe el nodo raiz pero no limpia el resto del estado;
      // por eso el canvas provisional no puede tener hijos, o quedarian
      // huerfanos ahi dentro y serialize() los recorre todos.
      const raiz = (
        <Element
          is={EditableContainer}
          canvas
          custom={{ displayName: isModal ? "Modal" : "Página" }}
        >
          <EditableRichText
            content={
              isModal
                ? "<p>Escribe el contenido de tu modal aqui.</p>"
                : "<p>Bienvenido a tu nueva pagina</p>"
            }
            sizeUnit="px"
            sizeDesktop={isModal ? 16 : 32}
            sizeTablet={isModal ? 16 : 32}
            sizeMobile={isModal ? 16 : 32}
            fontWeight={isModal ? 400 : 700}
          />
        </Element>
      )
      const arbol = query.parseReactElement(raiz).toNodeTree((node, jsx) => {
        if (jsx === raiz) node.id = ROOT_NODE
        return node
      })
      actions.history.ignore().addNodeTree(arbol)
    }

    // craft acaba de avisar de que el arbol cambio (su suscripcion mira el JSON
    // serializado, asi que el history.ignore() no la silencia). Sin volver a
    // fijar el punto de partida, el editor abriria diciendo "cambios sin
    // guardar" sin que nadie haya tocado nada.
    //
    // Con el respaldo local es al reves: eso es trabajo que no esta en el
    // servidor, asi que entra marcado como pendiente. Si se rebaselineara, el
    // editor diria que no hay nada que guardar justo despues de rescatarlo, y
    // el boton de guardar —que se apaga sin cambios— no dejaria guardarlo.
    if (restaurado) sessionRef.current?.markDirty()
    else sessionRef.current?.rebaseline()

    // Dos frames: el primero deja que craft repinte el arbol recien cargado, el
    // segundo cae ya con el canvas pintado. Ahi se avisa de que el contenido esta
    // a la vista y el aviso de "Cargando" se puede fundir.
    const raf1 = requestAnimationFrame(() => {
      // Un aviso de mas al store, ya fuera del ciclo de efectos.
      //
      // Los suscriptores de craft (useCollector) leen el estado en su primer
      // render y se suscriben DESPUES, en un efecto, sin volver a leerlo al
      // suscribirse: lo que cambie entre medias no les llega, y se quedan
      // pintando lo viejo hasta el siguiente aviso. Por eso el canvas abria en
      // blanco y aparecia al pasar el raton por encima o al abrir Capas: las
      // dos cosas mueven el store y con ese aviso se ponen al dia.
      //
      // setOptions sin cambiar nada vale como aviso: el dispatch de craft llama
      // a notify() siempre, cambie o no el estado. craft ya deja setOptions
      // fuera del historial, asi que no deja un paso vacio en deshacer. Va en
      // un frame aparte para caer cuando todos los suscriptores ya existen.
      actions.setOptions(() => {})

      const raf2 = requestAnimationFrame(() => onPainted?.())
      pintadoRaf.current = raf2
    })
    pintadoRaf.current = raf1
  }, [loaded, json, isModal, restaurado, actions, query, sessionRef, onPainted])

  // Si esto se desmonta antes de pintar (cambio de pagina), no dejar el frame
  // pendiente llamando a onPainted sobre algo que ya no esta.
  useEffect(
    () => () => {
      if (pintadoRaf.current !== null) cancelAnimationFrame(pintadoRaf.current)
    },
    []
  )

  return null
}

function LayersPanel() {
  const selection = useLayersSelection()

  return (
    <div ref={selection?.listRef}>
      <Layers expandRootOnLoad renderLayer={CustomLayer} />
    </div>
  )
}

interface EditorLayoutProps {
  initialJson?: string
  /**
   * Cambiarlo recarga el contenido del canvas con el `initialJson` de ahora.
   * Lo usa el descarte de borrador, que deja en pantalla algo que ya no existe.
   */
  contentVersion?: number
  pageTitle?: string
  onPageTitleChange?: (titulo: string) => void
  lastEditedAt?: string | null
  /** Guarda sin publicar: la tienda sigue sirviendo lo de antes. */
  onSaveDraft: (json: string) => Promise<SaveOutcome>
  /** Lo del canvas pasa a ser lo que ve el publico. */
  onPublish: (json: string) => Promise<SaveOutcome>
  /** Publica como privada: solo la ve quien viene del ERP. */
  onPublishPrivate?: (json: string) => Promise<SaveOutcome>
  /** Programa la publicacion para `scheduledAt` (ISO). */
  onSchedule?: (json: string, scheduledAt: string) => Promise<SaveOutcome>
  /** Tira el borrador. La confirmacion la pide la barra, no esto. */
  onDiscardDraft?: () => Promise<SaveOutcome>
  /** Si queda borrador que descartar; de eso depende que se ofrezca. */
  hasDraft?: boolean
  publishState?: PublishState
  /** Tiene cambios guardados sin publicar (matiz sobre Publicada/Privada). */
  pending?: boolean
  isModal?: boolean
  initialModalConfig?: ModalConfig
  onModalConfigChange?: (config: ModalConfig) => void
  /**
   * Si el contenido de la pagina ya llego.
   *
   * El editor se monta ANTES de que llegue: la barra, los paneles y el canvas
   * aparecen al hidratar y lo unico que falta es el contenido. Mientras esto sea
   * false el canvas lleva un contenedor vacio, esta tapado y no se puede
   * guardar; al pasar a true se carga el contenido de verdad.
   */
  contentLoaded?: boolean
  /**
   * Si `initialJson` es el respaldo local rescatado y no lo que hay guardado.
   * Ese contenido entra como pendiente de guardar; ver ContentLoader.
   */
  contentRestored?: boolean
}

export function EditorLayout({
  initialJson,
  contentVersion = 0,
  pageTitle,
  onPageTitleChange,
  lastEditedAt,
  onSaveDraft,
  onPublish,
  onPublishPrivate,
  onSchedule,
  onDiscardDraft,
  hasDraft = false,
  publishState = "draft",
  pending = false,
  isModal,
  initialModalConfig,
  onModalConfigChange,
  contentLoaded = true,
  contentRestored = false,
}: EditorLayoutProps) {
  // Que se esta haciendo ahora mismo contra el servidor. No basta un booleano:
  // los botones dicen cosas distintas segun la accion ("Guardando..." en el de
  // borrador mientras se publica seria mentira), y todos se bloquean igual.
  const [accionEnCurso, setAccionEnCurso] = useState<
    "draft" | "publish" | "private" | "schedule" | "discard" | null
  >(null)
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const sessionRef = useRef<SessionControllerHandle | null>(null)
  const hasInitialJson =
    typeof initialJson === "string" && initialJson.trim().length > 0

  // Antes de que <Frame> deserialice: si algun bloque guardado no esta en
  // el resolver, avisar de cual. Ver lib/craft-resolver-check.ts.
  useMemo(() => {
    if (!hasInitialJson) return
    assertResolverCompleto(
      initialJson,
      resolver,
      "editor (components/editor/editor-layout.tsx)"
    )
  }, [hasInitialJson, initialJson])

  // El aviso de "cargando": se va cuando el contenido ya se PINTO, no solo cuando
  // llego. ContentLoader lo avisa tras deserializar y dejar que craft repinte
  // (ver onPainted). Sin esto, el aviso se iba al llegar el contenido pero el
  // canvas tardaba un instante mas en pintarse y quedaba en blanco.
  const [aviso, setAviso] = useState<EstadoAviso>("visible")
  const [contenidoPintado, setContenidoPintado] = useState(false)

  // Al recargar el canvas (descartar borrador sube contentVersion) el contenido
  // se vuelve a pintar, asi que el aviso tiene que volver hasta que este listo.
  useEffect(() => {
    setContenidoPintado(false)
  }, [contentVersion])

  useEffect(() => {
    if (!contentLoaded || !contenidoPintado) {
      setAviso("visible")
      return
    }
    setAviso("saliendo")
    const fundido = window.setTimeout(() => setAviso("fuera"), MS_FUNDIDO)
    return () => window.clearTimeout(fundido)
  }, [contentLoaded, contenidoPintado])

  // Pipeline único de guardado: lo comparten el botón Guardar y el modal de
  // salida, para que el estado dirty tenga una sola fuente de verdad.
  // El isDirty de la sesion solo mira el JSON del canvas, asi que un cambio
  // de nombre no contaria como pendiente y se perderia sin avisar al salir.
  const [tituloSinGuardar, setTituloSinGuardar] = useState(false)
  // El dirty del canvas llega desde SessionController, que solo avisa cuando
  // cambia. El del titulo va aparte porque no pasa por el JSON de craft.
  const [canvasSinGuardar, setCanvasSinGuardar] = useState(false)
  // La configuracion del modal (disparador, ancho, velo...) tampoco pasa por
  // el JSON de craft: vive en el envoltorio que guarda la pagina, asi que se
  // sigue aparte, como el titulo. Sin esto, cambiar solo el disparador no
  // contaria como pendiente y el boton de guardar quedaria apagado.
  const [configSinGuardar, setConfigSinGuardar] = useState(false)
  const [sinConexion, setSinConexion] = useState(false)

  const hayCambiosSinGuardar =
    canvasSinGuardar || tituloSinGuardar || configSinGuardar

  const handleModalConfigChange = useCallback(
    (config: ModalConfig) => {
      onModalConfigChange?.(config)
      setConfigSinGuardar(true)
    },
    [onModalConfigChange]
  )

  /**
   * Aviso del navegador al cerrar la pestana, recargar o salir del sitio con
   * trabajo sin guardar.
   *
   * El respaldo local ya rescata el contenido, pero solo se descubre volviendo
   * a abrir la pagina: quien cierra creyendo que estaba guardado no se entera
   * de nada. Esto interrumpe antes.
   *
   * El texto lo decide el navegador. Hace anos que ignoran el mensaje propio
   * para que ninguna pagina invente el aviso, asi que lo unico que se puede
   * hacer es pedir el dialogo, y hay que pedirlo de las dos formas porque no
   * todos miran la misma.
   *
   * Solo se engancha cuando hay algo que perder: un beforeunload permanente le
   * quita al navegador la posibilidad de restaurar la pagina desde la cache al
   * volver atras.
   *
   * No cubre la navegacion interna (el enlace de volver al listado), que no
   * dispara este evento; de eso se encarga el dialogo de salida.
   */
  useEffect(() => {
    if (!hayCambiosSinGuardar) return

    const avisarAntesDeSalir = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = ""
    }

    window.addEventListener("beforeunload", avisarAntesDeSalir)
    return () => window.removeEventListener("beforeunload", avisarAntesDeSalir)
  }, [hayCambiosSinGuardar])

  // El ancho de la fila, para pasar los topes de px a porcentaje.
  const filaRef = useRef<HTMLDivElement>(null)
  const [anchoFila, setAnchoFila] = useState(0)
  const panelIzqRef = useRef<ImperativePanelHandle>(null)
  const [panelIzqCerrado, setPanelIzqCerrado] = useState(false)
  // El panel de Propiedades se pliega igual que el izquierdo. En celular,
  // ademas, los dos no caben a la vez: abrir uno cierra el otro, y se entra
  // con ambos cerrados para ver el lienzo.
  const [propsCerrado, setPropsCerrado] = useState(false)
  const panelDerRef = useRef<ImperativePanelHandle>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const el = filaRef.current
    if (!el) return
    const observador = new ResizeObserver(([entrada]) => {
      setAnchoFila(entrada.contentRect.width)
    })
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  // Hasta la primera medida se usa un ancho de referencia: da un tamaño de
  // salida razonable y el observador lo corrige en el primer frame.
  const anchoBase = anchoFila || 1440
  const enPorcentaje = (px: number) => (px / anchoBase) * 100

  const alternarPanelIzq = useCallback(() => {
    const panel = panelIzqRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
      if (isMobile) panelDerRef.current?.collapse()
    } else {
      panel.collapse()
    }
  }, [isMobile])

  const abrirProps = useCallback(() => {
    panelDerRef.current?.expand()
    if (isMobile) panelIzqRef.current?.collapse()
  }, [isMobile])

  const alternarProps = useCallback(() => {
    const panel = panelDerRef.current
    if (!panel) return
    if (panel.isCollapsed()) abrirProps()
    else panel.collapse()
  }, [abrirProps])

  // Al pasar a celular se cierran los dos (se entra viendo el lienzo); al
  // volver a escritorio se reabren, que es como estaban de fabrica.
  useEffect(() => {
    if (isMobile) {
      panelIzqRef.current?.collapse()
      panelDerRef.current?.collapse()
    } else {
      panelIzqRef.current?.expand()
      panelDerRef.current?.expand()
    }
  }, [isMobile])

  const handlePageTitleChange = useCallback(
    (titulo: string) => {
      onPageTitleChange?.(titulo)
      setTituloSinGuardar(true)
    },
    [onPageTitleChange]
  )

  // Lo que hay que hacer cuando un guardado no sale, sea del borrador o de la
  // publicacion. Se comparte tambien con el descarte, que falla igual.
  // ERP: un "unauthorized" es no tener el permiso o haber perdido la sesión del
  // ERP. No hay sesión del editor que expirar: se avisa y el trabajo queda en
  // el respaldo local (lo escribe la página).
  const manejarFalloDeGuardado = useCallback(
    (outcome: SaveOutcome, _jsonPendiente: string | null, mensajeError: string) => {
      if (outcome === "unauthorized") {
        toast.error(`${mensajeError}: no tienes permiso o tu sesión terminó`)
      } else if (outcome === "offline") {
        // Sin toast: el aviso ambar de la barra ya lo dice, y ahi se queda
        // mientras dure el problema en vez de desvanecerse a los segundos.
        setSinConexion(true)
      } else {
        toast.error(mensajeError)
      }
    },
    []
  )

  const ejecutarGuardado = useCallback(
    async (
      json: string,
      accion: "draft" | "publish" | "private",
      scheduledAt?: string
    ): Promise<SaveOutcome> => {
      // Sin contenido cargado el canvas esta vacio a proposito y guardarlo
      // sobrescribiria la pagina real con una en blanco. Los botones ya estan
      // deshabilitados; esto cubre a los demas que llaman aqui (el dialogo de
      // "Guardar cambios" al expirar la sesion).
      if (!contentLoaded) return "error"

      // El modo de programacion viaja por scheduledAt; lo marca aparte en la
      // barra ("Programando...") aunque comparta el flujo de publicar.
      const enCurso = scheduledAt ? "schedule" : accion
      setAccionEnCurso(enCurso)
      try {
        const outcome =
          accion === "private"
            ? await (onPublishPrivate?.(json) ?? Promise.resolve<SaveOutcome>("error"))
            : scheduledAt
              ? await (onSchedule?.(json, scheduledAt) ??
                  Promise.resolve<SaveOutcome>("error"))
              : accion === "publish"
                ? await onPublish(json)
                : await onSaveDraft(json)
        // Guardar bien no se avisa: el aviso solo aparece cuando falla. Lo que
        // cambia lo que ve el publico si, porque eso no se ve desde aqui.
        if (outcome === "ok") {
          sessionRef.current?.markSaved(json)
          setTituloSinGuardar(false)
          setConfigSinGuardar(false)
          setSinConexion(false)
          if (scheduledAt) toast.success("Publicación programada")
          else if (accion === "publish") toast.success("Cambios publicados")
          else if (accion === "private") toast.success("Publicado como privada")
        } else {
          manejarFalloDeGuardado(
            outcome,
            json,
            scheduledAt
              ? "No se pudo programar la publicación"
              : accion === "publish"
                ? "No se pudieron publicar los cambios"
                : accion === "private"
                  ? "No se pudo publicar como privada"
                  : "No se pudieron guardar los cambios"
          )
        }
        return outcome
      } finally {
        setAccionEnCurso(null)
      }
    },
    [onSaveDraft, onPublish, onPublishPrivate, onSchedule, manejarFalloDeGuardado, contentLoaded]
  )

  const performSaveDraft = useCallback(
    (json: string) => ejecutarGuardado(json, "draft"),
    [ejecutarGuardado]
  )

  const performPublish = useCallback(
    (json: string) => ejecutarGuardado(json, "publish"),
    [ejecutarGuardado]
  )

  const performPublishPrivate = useCallback(
    (json: string) => ejecutarGuardado(json, "private"),
    [ejecutarGuardado]
  )

  const performSchedule = useCallback(
    (json: string, scheduledAt: string) => ejecutarGuardado(json, "publish", scheduledAt),
    [ejecutarGuardado]
  )

  const performDiscardDraft = useCallback(async () => {
    if (!onDiscardDraft || !contentLoaded) return

    setAccionEnCurso("discard")
    try {
      const outcome = await onDiscardDraft()
      if (outcome === "ok") {
        // El canvas todavia muestra el borrador; quien recarga el contenido es
        // el que llama, subiendo contentVersion.
        toast.success("Borrador descartado")
        setTituloSinGuardar(false)
        setConfigSinGuardar(false)
        setSinConexion(false)
      } else {
        // Sin JSON pendiente: aqui no se estaba guardando nada que respaldar.
        manejarFalloDeGuardado(outcome, null, "No se pudo descartar el borrador")
      }
    } finally {
      setAccionEnCurso(null)
    }
  }, [onDiscardDraft, contentLoaded, manejarFalloDeGuardado])

  // Si el navegador recupera la red, el aviso sobra aunque no se haya vuelto
  // a guardar. El corte se detecta al guardar (status 0), no aqui.
  useEffect(() => {
    const alVolver = () => setSinConexion(false)
    window.addEventListener("online", alVolver)
    return () => window.removeEventListener("online", alVolver)
  }, [])

  // Estable a propósito: craftjs captura las options una sola vez al crear el store
  const handleNodesChange = useCallback((craftQuery: CraftQueryLike) => {
    sessionRef.current?.onNodesChange(craftQuery)
  }, [])

  const handleViewportChange = useCallback(
    (nextViewport: Viewport) => {
      setViewport(nextViewport)
    },
    []
  )

  // Solo con config: es lo que dibuja el marco del popup alrededor del lienzo.
  const popupConfig = isModal ? initialModalConfig : undefined

  return (
    <ViewportContext.Provider value={viewport}>
    <CanvasCameraProvider autoFit={!contentLoaded}>
    <Editor
      resolver={resolver}
      enabled
      onNodesChange={handleNodesChange}
      // craft ya trae seleccion multiple, pero de fabrica la ata a metaKey, que
      // en Windows es la tecla del logo y nadie la usa para esto. Con ctrl vale
      // igual en el canvas y en el panel de capas, porque el connector "layer"
      // hereda este mismo handler de seleccion del core.
      handlers={(store) =>
        new DefaultEventHandlers({
          store,
          removeHoverOnMouseleave: false,
          isMultiSelectEnabled: (e) => e.ctrlKey || e.metaKey,
        })
      }
    >
    <LayersSelectionProvider>
      <SessionController
        handleRef={sessionRef}
        onDirtyChange={setCanvasSinGuardar}
      />
      {/* Despues de SessionController a proposito: los efectos corren en orden
          de arbol, y este necesita que el handle de la sesion ya exista para
          poder volver a fijar el punto de partida al cargar. */}
      <ContentLoader
        key={contentVersion}
        json={hasInitialJson ? initialJson : undefined}
        isModal={isModal}
        loaded={contentLoaded}
        restaurado={contentRestored}
        sessionRef={sessionRef}
        onPainted={() => setContenidoPintado(true)}
      />
      <div className="h-screen flex flex-col">
        <EditorToolbar
          onSaveDraft={performSaveDraft}
          onPublish={performPublish}
          onPublishPrivate={onPublishPrivate ? performPublishPrivate : undefined}
          onSchedule={onSchedule ? performSchedule : undefined}
          onDiscardDraft={onDiscardDraft ? performDiscardDraft : undefined}
          hasDraft={hasDraft}
          publishState={publishState}
          pending={pending}
          savingAction={accionEnCurso}
          pageTitle={pageTitle}
          // Sin contenido el nombre se pinta pero no se edita: el que hay es
          // provisional y el registro lo va a reemplazar en cuanto llegue, asi
          // que un cambio hecho ahora se perderia sin avisar.
          onPageTitleChange={contentLoaded ? handlePageTitleChange : undefined}
          lastEditedAt={lastEditedAt}
          hasUnsavedChanges={hayCambiosSinGuardar}
          isOffline={sinConexion}
          viewport={viewport}
          onViewportChange={handleViewportChange}
          canSave={contentLoaded}
          propsCerrado={propsCerrado}
          onAlternarProps={alternarProps}
        />

        {/* La fila se mide para convertir los topes de px a porcentaje. */}
        <div ref={filaRef} className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - Components. Se puede estirar entre 240 y 340px y
              plegar del todo con el boton de al lado. El scroll no es de la
              columna: las pestañas se quedan fijas y cada panel rueda por
              dentro. */}
          <ResizablePanel
            ref={panelIzqRef}
            order={1}
            collapsible
            collapsedSize={0}
            defaultSize={enPorcentaje(PANEL_IZQ_MIN_PX)}
            minSize={enPorcentaje(PANEL_IZQ_MIN_PX)}
            maxSize={enPorcentaje(PANEL_IZQ_MAX_PX)}
            onCollapse={() => setPanelIzqCerrado(true)}
            onExpand={() => setPanelIzqCerrado(false)}
          >
          <div className="h-full border-r border-border bg-background flex flex-col overflow-hidden">
            <Tabs defaultValue="components" className="flex flex-1 flex-col min-h-0">
              <TabsList className="w-full rounded-none border-b shrink-0">
                <TabsTrigger value="components" className="flex-1 text-xs">
                  Componentes
                </TabsTrigger>
                <TabsTrigger value="layers" className="flex-1 text-xs">
                  Capas
                </TabsTrigger>
              </TabsList>
              {/* Cada pestaña con su propio contenedor, y el display:flex
                  siempre en el div de dentro, nunca en el TabsContent: Radix
                  no desmonta la pestaña inactiva, solo le pone el atributo
                  hidden, y una clase que fije display le gana a esa regla del
                  navegador. Con "flex" en el TabsContent, el panel apagado se
                  seguia pintando encima del otro. */}
              <TabsContent value="components" className="mt-0 flex-1 min-h-0">
                <div className="flex h-full flex-col">
                  <EditorSidebar components={defaultComponents} />
                </div>
              </TabsContent>
              <TabsContent value="layers" className="mt-0 flex-1 min-h-0">
                <ScrollArea
                  className="h-full [&>[data-radix-scroll-area-viewport]>div]:!block"
                  thumbClassName="bg-primary"
                >
                  <LayersPanel />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* El lienzo. Es "relative" para el boton de plegado. */}
          <ResizablePanel order={2} className="relative flex">
            {/* Fuera del panel plegable y siempre en el mismo sitio, para
                seguir a la vista cuando la columna esta cerrada. Al plegarse,
                este panel empieza en x=0 y el boton queda pegado al borde. */}
            <Button
              variant="default"
              size="icon"
              className="absolute left-0 top-0 z-20 h-10 w-10 rounded-none"
              onClick={alternarPanelIzq}
              aria-expanded={!panelIzqCerrado}
              title={
                panelIzqCerrado
                  ? "Mostrar componentes y capas"
                  : "Ocultar componentes y capas"
              }
              aria-label={
                panelIzqCerrado
                  ? "Mostrar componentes y capas"
                  : "Ocultar componentes y capas"
              }
            >
              {panelIzqCerrado ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

          {/* Center - Canvas: la camara (zoom/pan) la pone CanvasViewport.

              El div de fuera es el ancla del aviso: tiene que quedarse sobre el
              canvas y solo sobre el, no sobre el panel de Propiedades. */}
          <div className="relative flex min-w-0 flex-1">
          {/* Mientras no hay contenido, el canvas se ve y se recorre igual; lo
              unico apagado es el contenido, que no se selecciona ni admite que
              se le suelte un componente encima. */}
          <CanvasViewport inert={!contentLoaded}>
            <CanvasPage
              className={cn(
                // ERP: store-canvas pone los colores de la tienda en el lienzo
                // (editor.css); el resto del editor sigue con los del ERP.
                "store-canvas mx-auto shadow-sm border border-border overflow-hidden",
                popupConfig ? "relative isolate bg-muted" : "bg-background"
              )}
              style={{
                // Ancho de navegador real, no el del panel: si la pagina se
                // estirase al panel, el diseño cambiaria segun el tamaño de la
                // ventana de quien edita. El popup tambien: su marco se mide
                // contra la pantalla del modo que se esta viendo.
                width: `${VIEWPORT_WIDTHS[viewport]}px`,
                ...(popupConfig ? { height: `${ALTO_ESCENARIO_POPUP[viewport]}px` } : null),
                ...(contentLoaded
                  ? null
                  : { minHeight: `${ALTO_PAGINA_CARGANDO}px` }),
              }}
            >
              {/* El canvas provisional, y solo eso: el contenido de la pagina
                  lo mete ContentLoader cuando llega (ver ahi por que no entra
                  por <Frame>).

                  Sin hijos a proposito. Para una pagina sin contenido, cargar
                  significa sobrescribir el nodo raiz con addNodeTree, que no
                  limpia el resto del estado: cualquier hijo que tuviera este
                  provisional quedaria huerfano ahi, y serialize() los recorre
                  todos, asi que acabaria guardado en la pagina.

                  El nombre es provisional igual: al montar todavia no se sabe
                  si la pagina es un modal, y cargar lo reemplaza de todas
                  formas. */}
              <PopupCanvasFrame config={popupConfig} viewport={viewport}>
                <Frame>
                  <Element
                    is={EditableContainer}
                    canvas
                    custom={{ displayName: "Página" }}
                  />
                </Frame>
              </PopupCanvasFrame>
            </CanvasPage>
          </CanvasViewport>

          {/* El aviso. Sin puntero y sin fondo que tape: solo dice que el
              contenido viene en camino, mientras el canvas de debajo se ve y se
              recorre con normalidad. */}
          {aviso !== "fuera" && (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center transition-opacity duration-200",
                aviso === "saliendo" && "opacity-0"
              )}
            >
              <span className="rounded-full border border-border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                Cargando contenido...
              </span>
            </div>
          )}
          </div>

          {/* En celular, seleccionar algo (en el lienzo o en Capas) abre
              Propiedades, que a su vez cierra el panel izquierdo. */}
          {isMobile && <AbrirPropsAlSeleccionar onSelect={abrirProps} />}
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Settings. El mismo panel plegable que el de la
              izquierda, con los mismos topes; lo unico distinto es que su boton
              vive en el toolbar. */}
          {/* El scroll no es de la columna: "Propiedades" y el nombre del
              componente se quedan fijos y solo ruedan sus propiedades. Quien
              pone el overflow es SettingsPanel. */}
          <ResizablePanel
            ref={panelDerRef}
            order={3}
            collapsible
            collapsedSize={0}
            defaultSize={enPorcentaje(PANEL_DER_DEFAULT_PX)}
            minSize={enPorcentaje(PANEL_IZQ_MIN_PX)}
            maxSize={enPorcentaje(PANEL_IZQ_MAX_PX)}
            onCollapse={() => setPropsCerrado(true)}
            onExpand={() => setPropsCerrado(false)}
          >
          <div className="h-full border-l border-border bg-background flex flex-col overflow-hidden">
            {isModal ? (
              <Tabs defaultValue="settings" className="flex flex-1 flex-col min-h-0">
                <TabsList className="w-full rounded-none border-b shrink-0">
                  <TabsTrigger value="settings" className="flex-1 text-xs">
                    Propiedades
                  </TabsTrigger>
                  <TabsTrigger value="modal" className="flex-1 text-xs">
                    Config Modal
                  </TabsTrigger>
                </TabsList>
                {/* Igual que en la columna izquierda: el display:flex va en el
                    div de dentro y nunca en el TabsContent, que Radix deja
                    montado con hidden cuando la pestaña no esta activa. */}
                <TabsContent value="settings" className="mt-0 flex-1 min-h-0">
                  <div className="flex h-full flex-col">
                    <SettingsPanel />
                  </div>
                </TabsContent>
                <TabsContent value="modal" className="mt-0 flex-1 min-h-0">
                  <div className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {initialModalConfig && onModalConfigChange && (
                      <ModalConfigPanel
                        config={initialModalConfig}
                        onChange={handleModalConfigChange}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <div className="p-3 border-b border-border shrink-0">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Propiedades
                  </h3>
                </div>
                <SettingsPanel />
              </>
            )}
          </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        </div>
      </div>

    </LayersSelectionProvider>
    </Editor>
    </CanvasCameraProvider>
    </ViewportContext.Provider>
  )
}

/**
 * Avisa cada vez que se selecciona un nodo. Va como componente y no como
 * efecto del layout porque el estado de seleccion vive en craft, y a el solo
 * se llega con useEditor desde dentro de <Editor>.
 *
 * Mira el id y no "si hay seleccion": con A seleccionado y Propiedades
 * cerrado, tocar B tiene que abrirlo, y un booleano no cambiaria.
 */
function AbrirPropsAlSeleccionar({ onSelect }: { onSelect: () => void }) {
  const { seleccionadoId } = useEditor((state) => ({
    seleccionadoId: Array.from(state.events.selected)[0] ?? null,
  }))
  useEffect(() => {
    if (seleccionadoId) onSelect()
  }, [seleccionadoId, onSelect])
  return null
}
