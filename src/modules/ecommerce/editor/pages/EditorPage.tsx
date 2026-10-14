// Editor de una página del ecommerce, a pantalla completa (fuera de
// DashboardLayout). Port de app/(admin)/editor/[pageId]/page.tsx de
// ecommerce-multicliente: lo único que cambia es de dónde salen el slug (la
// ruta del ERP), el canal (?canal=) y la sesión (la del ERP, sin la propia del
// editor).
import { useEffect, useState, useCallback } from "react"
import { useParams } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { EditorLayout } from "@/modules/ecommerce/editor/components/editor-layout"
import { LocalBackupDialog } from "@/modules/ecommerce/editor/components/session-modals"
import { type SaveOutcome } from "@/modules/ecommerce/editor/components/session-controller"
import { useEditorChannel } from "@/modules/ecommerce/editor/hooks/use-editor-channel"
import "@/modules/ecommerce/editor/editor.css"
import {
  saveDraftResult,
  publishPageResult,
  publishPrivateResult,
  schedulePageResult,
  discardDraftResult,
  saveModalDraftResult,
  publishModalResult,
  loadEditorPageResult,
  decodeModalContentJson,
  defaultModalConfig,
  resolvePublishState,
  hasPendingDraft,
  type VisualEditRecord,
  type VisualEditStatus,
  type ModalConfig,
  type StoreFailureReason,
} from "@/modules/ecommerce/editor/lib/editor-store"
import {
  readEditorBackup,
  writeEditorBackup,
  clearEditorBackup,
  type EditorBackup,
} from "@/modules/ecommerce/editor/lib/editor-session"

type LoadState = "loading" | "ready" | "error"

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * La ultima escritura del servidor, sea del borrador o de lo publicado.
 *
 * Es contra esto que se mide si el respaldo local del navegador es mas nuevo y
 * hay que ofrecer restaurarlo. `updated_at` ya se mueve con el guardado de
 * borrador, asi que solo con el bastaria; se mira tambien `draft_updated_at`
 * porque equivocarse aqui significa ofrecer restaurar por encima de un borrador
 * que ya esta a salvo en la base.
 */
function ultimaEscritura(record: VisualEditRecord | null): number {
  if (!record) return 0
  return Math.max(
    parseTimestamp(record.updated_at),
    parseTimestamp(record.draft_updated_at)
  )
}

/**
 * La marca que se pinta en "Guardado ...".
 *
 * `updated_at` vale para los dos casos: es la ultima escritura de la fila, se
 * haya guardado borrador o publicado (la fecha de publicacion va aparte, en
 * `published_at`). Si no llegara, vale el reloj de aqui: se acaba de guardar.
 */
function marcaDeGuardado(record: VisualEditRecord): string {
  return record.updated_at ?? new Date().toISOString()
}

export default function EditorPage() {
  const params = useParams<{ slug: string }>()
  const pageId = params.slug ?? "home"
  const slug = pageId === "home" ? "home" : pageId
  const { canal, estado: estadoCanales } = useEditorChannel()
  const canalId = canal?.id ?? null

  // El nombre que se pinta hasta que llega el registro. El slug esta en la URL
  // desde el primer frame, asi que la barra abre con un nombre en vez de con un
  // hueco que se rellena despues.
  const tituloProvisional = pageId === "home" ? "Home" : pageId

  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [initialJson, setInitialJson] = useState<string | undefined>(undefined)
  const [pageTitle, setPageTitle] = useState(tituloProvisional)
  // Cuando se guardo por ultima vez. Sale del registro al abrir y se refresca
  // con el que devuelve el guardado, que ya trae el updated_at nuevo.
  const [ultimoCambio, setUltimoCambio] = useState<string | null>(null)
  const [currentPageType, setCurrentPageType] = useState<VisualEditRecord["type"] | undefined>(undefined)
  const [isModal, setIsModal] = useState(false)
  const [modalConfig, setModalConfig] = useState<ModalConfig>(defaultModalConfig)
  const [pendingBackup, setPendingBackup] = useState<EditorBackup | null>(null)
  // Si lo que se va a cargar en el canvas es el respaldo local y no lo del
  // servidor. Ese contenido entra pendiente de guardar: es trabajo que no
  // llego a escribirse, y darlo por guardado dejaria el boton de guardar
  // apagado justo despues de rescatarlo.
  const [contenidoRestaurado, setContenidoRestaurado] = useState(false)
  // Lo publicado y el borrador se siguen por separado, y de los dos sale el
  // estado que se pinta en la barra. Una pagina que todavia no existe arranca
  // como borrador: no hay nada publicado que la tienda pueda servir.
  const [publishStatus, setPublishStatus] = useState<VisualEditStatus>("draft")
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [tieneBorrador, setTieneBorrador] = useState(false)
  // Se sube al descartar el borrador: obliga a releer la fila y a recargar el
  // canvas con lo publicado, sin desmontar el editor entero.
  const [recargaToken, setRecargaToken] = useState(0)

  useEffect(() => {
    // Sin canal no hay a quién pedir la página (x-channel-id).
    if (canalId === null) return

    async function load() {
      setLoadState("loading")
      setPageTitle(tituloProvisional)
      setInitialJson(undefined)
      setCurrentPageType(undefined)
      setIsModal(false)
      setModalConfig(defaultModalConfig)
      setPendingBackup(null)
      setPublishStatus("draft")
      setScheduledAt(null)
      setTieneBorrador(false)
      // Por la ruta autenticada, no por la publica: esa solo devuelve lo
      // publicado, asi que por ahi ni los borradores ni las paginas nuevas se
      // podrian abrir.
      const result = await loadEditorPageResult(slug)

      let record: VisualEditRecord | null = null
      if (result.ok === true) {
        record = result.data
        const borradorPendiente = hasPendingDraft(record)
        setPageTitle(record.title)
        setCurrentPageType(record.type)
        setPublishStatus(record.status)
        setScheduledAt(record.scheduled_at ?? null)
        setTieneBorrador(borradorPendiente)
        setUltimoCambio(marcaDeGuardado(record))

        // El editor edita SIEMPRE la copia de trabajo (draft_json), que ahora
        // esta siempre poblada; solo cae a content_json en filas antiguas que
        // aun no la tienen.
        const fuente = record.draft_json ?? record.content_json

        if (record.type === "modal") {
          setIsModal(true)
          if (fuente) {
            const decoded = decodeModalContentJson(fuente)
            if (decoded) {
              setModalConfig(decoded.config)
              setInitialJson(decoded.content?.trim() ? decoded.content : undefined)
            }
          }
        } else {
          setInitialJson(fuente?.trim() ? fuente : undefined)
        }
      } else if (result.reason === "notFound") {
        // Página nueva: canvas vacío es correcto
      } else {
        // Error de red/servidor: no cargar contenido para no arriesgar
        // sobrescribir contenido real con un canvas vacío
        setLoadState("error")
        return
      }

      const backup = readEditorBackup(slug)
      if (backup && backup.savedAt > ultimaEscritura(record)) {
        setPendingBackup(backup)
      }

      setLoadState("ready")
    }
    load()
  }, [pageId, slug, tituloProvisional, recargaToken, canalId])

  // El desenlace de un guardado que fallo, igual para el borrador y para la
  // publicacion: el respaldo local es lo unico que salva el trabajo cuando cae
  // la sesion o la red, asi que se escribe aqui y no en cada llamador.
  const resolverFallo = useCallback(
    (fallo: { reason: StoreFailureReason; status: number }, json: string): SaveOutcome => {
      if (fallo.reason === "unauthorized") {
        writeEditorBackup(slug, json)
        return "unauthorized"
      }
      // status 0 = el fetch ni siquiera salio, o sea que no hay red. Se
      // respalda aqui porque es lo unico que salva el trabajo, y sin esto el
      // aviso de "Guardado aqui" que ve quien edita seria mentira.
      if (fallo.status === 0) {
        writeEditorBackup(slug, json)
        return "offline"
      }
      return "error"
    },
    [slug]
  )

  // Guardar sin publicar. El estado de publicacion no se mueve: una pagina que
  // nunca se publico sigue siendo borrador, y una publicada sigue publicada con
  // cambios pendientes encima.
  const handleSaveDraft = useCallback(
    async (json: string): Promise<SaveOutcome> => {
      const result = isModal
        ? await saveModalDraftResult(slug, pageTitle || slug, modalConfig, json)
        : await saveDraftResult(slug, pageTitle || slug, json, currentPageType ?? "page")

      if (result.ok === true) {
        clearEditorBackup(slug)
        setTieneBorrador(true)
        setUltimoCambio(marcaDeGuardado(result.data))
        return "ok"
      }
      return resolverFallo(result, json)
    },
    [slug, pageTitle, currentPageType, isModal, modalConfig, resolverFallo]
  )

  // Publicar: lo que hay en el canvas pasa a ser lo que sirve la tienda y el
  // borrador desaparece.
  const handlePublish = useCallback(
    async (json: string): Promise<SaveOutcome> => {
      const result = isModal
        ? await publishModalResult(slug, pageTitle || slug, modalConfig, json)
        : await publishPageResult(slug, pageTitle || slug, json, currentPageType ?? "page")

      if (result.ok === true) {
        clearEditorBackup(slug)
        setPublishStatus("published")
        setScheduledAt(null)
        setTieneBorrador(false)
        setUltimoCambio(marcaDeGuardado(result.data))
        return "ok"
      }
      return resolverFallo(result, json)
    },
    [slug, pageTitle, currentPageType, isModal, modalConfig, resolverFallo]
  )

  // Publicar como privada. Solo para paginas (no modales): un popup no tiene
  // "ruta privada".
  const handlePublishPrivate = useCallback(
    async (json: string): Promise<SaveOutcome> => {
      const result = await publishPrivateResult(
        slug,
        pageTitle || slug,
        currentPageType ?? "page",
        json
      )
      if (result.ok === true) {
        clearEditorBackup(slug)
        setPublishStatus("private")
        setScheduledAt(null)
        setTieneBorrador(false)
        setUltimoCambio(marcaDeGuardado(result.data))
        return "ok"
      }
      return resolverFallo(result, json)
    },
    [slug, pageTitle, currentPageType, resolverFallo]
  )

  // Programar: se publica sola en la fecha dada.
  const handleSchedule = useCallback(
    async (json: string, scheduledAtIso: string): Promise<SaveOutcome> => {
      const result = await schedulePageResult(
        slug,
        pageTitle || slug,
        currentPageType ?? "page",
        scheduledAtIso,
        json
      )
      if (result.ok === true) {
        clearEditorBackup(slug)
        setPublishStatus("scheduled")
        setScheduledAt(result.data.scheduled_at ?? scheduledAtIso)
        setTieneBorrador(false)
        setUltimoCambio(marcaDeGuardado(result.data))
        return "ok"
      }
      return resolverFallo(result, json)
    },
    [slug, pageTitle, currentPageType, resolverFallo]
  )

  // Descartar el borrador destruye trabajo, asi que la confirmacion la pide la
  // barra antes de llegar aqui. Tras el descarte hay que releer: el canvas esta
  // mostrando justo lo que se acaba de tirar.
  const handleDiscardDraft = useCallback(async (): Promise<SaveOutcome> => {
    const result = await discardDraftResult(
      slug,
      pageTitle || slug,
      currentPageType ?? "page"
    )

    if (result.ok === true) {
      // El respaldo local es de la misma cesta que el borrador —trabajo sin
      // publicar—, asi que tirar uno tira el otro; si no, volveria a ofrecerse
      // para restaurar justo lo que se acaba de descartar.
      clearEditorBackup(slug)
      setTieneBorrador(false)
      // Lo que se va a recargar es lo publicado, no el respaldo: si la bandera
      // siguiera puesta, el contenido recien releido entraria marcado como
      // pendiente de guardar.
      setContenidoRestaurado(false)
      setRecargaToken((token) => token + 1)
      return "ok"
    }
    // Aqui no hay JSON que respaldar: no se estaba guardando nada.
    if (result.reason === "unauthorized") return "unauthorized"
    if (result.status === 0) return "offline"
    return "error"
  }, [slug, pageTitle, currentPageType])

  // El error si reemplaza la pantalla: no sabemos que hay en la pagina, asi que
  // el editor no debe llegar a ser usable ni por accidente.
  if (estadoCanales === "sin-canales" || estadoCanales === "error") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="mx-4 max-w-md text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {estadoCanales === "error"
              ? "No se pudieron cargar los canales del ecommerce"
              : "Este negocio no tiene un ecommerce configurado"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {estadoCanales === "error"
              ? "Recarga la página para intentarlo de nuevo."
              : "Se necesita un canal con url (tabla channels) para editar sus páginas."}
          </p>
        </div>
      </div>
    )
  }

  if (loadState === "error") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="mx-4 max-w-md text-center">
          <h2 className="text-lg font-semibold text-foreground">
            No se pudo cargar la página
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ocurrió un error al cargar el contenido. Para evitar sobrescribir
            cambios existentes, el editor no se abrirá. Recarga la página para
            intentarlo de nuevo.
          </p>
        </div>
      </div>
    )
  }

  if (canalId === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando editor...</p>
      </div>
    )
  }

  // Con un respaldo pendiente el contenido espera a la decision: asi se carga
  // una sola vez, ya sea el del servidor o el del respaldo.
  const contenidoCargado = loadState === "ready" && !pendingBackup

  return (
    <div className="editor-ecommerce">
      {/* El editor usa toast de "sonner"; el ERP no lo monta globalmente. */}
      <Toaster position="bottom-right" richColors />
      {/* El editor se monta en cuanto hidrata, sin esperar al contenido; el
          canvas entra despues y hasta entonces va tapado.

          La key por slug le da a cada pagina su propio estado de craft. Cambiar
          de pagina sin salir del editor no es un camino de la interfaz (se pasa
          por el listado, que desmonta esto), pero si lo fuera, reutilizar el
          estado dejaria nodos de la pagina anterior sueltos en el. */}
      <EditorLayout
        key={slug}
        initialJson={initialJson}
        // Sube al descartar el borrador y solo recarga el contenido del canvas:
        // los paneles, el zoom y el modo de pantalla se quedan como estaban.
        contentVersion={recargaToken}
        pageTitle={pageTitle}
        onPageTitleChange={setPageTitle}
        lastEditedAt={ultimoCambio}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        // Privada y programar solo para paginas: un modal no tiene "ruta privada"
        // ni sentido de fecha de publicacion como una pagina.
        onPublishPrivate={
          currentPageType !== "modal" && currentPageType !== "block"
            ? handlePublishPrivate
            : undefined
        }
        onSchedule={
          currentPageType !== "modal" && currentPageType !== "block"
            ? handleSchedule
            : undefined
        }
        onDiscardDraft={handleDiscardDraft}
        hasDraft={tieneBorrador}
        pending={tieneBorrador}
        publishState={resolvePublishState({
          status: publishStatus,
          scheduled_at: scheduledAt,
        })}
        isModal={isModal}
        initialModalConfig={modalConfig}
        onModalConfigChange={setModalConfig}
        contentLoaded={contenidoCargado}
        contentRestored={contenidoRestaurado}
      />

      {pendingBackup && (
        <LocalBackupDialog
          minutesAgo={Math.max(
            1,
            Math.round((Date.now() - pendingBackup.savedAt) / 60_000)
          )}
          onRestore={() => {
            setInitialJson(pendingBackup.json)
            setContenidoRestaurado(true)
            setPendingBackup(null)
          }}
          onDiscard={() => {
            clearEditorBackup(slug)
            setPendingBackup(null)
          }}
        />
      )}
    </div>
  )
}
