import { invokeFunction } from "@/integrations/supabase/invokeFunction"
import { FunctionError } from "@/shared/utils/functionError"
import { editorChannelHeaders } from "@/modules/ecommerce/editor/lib/editor-channel"

/**
 * Estados de una fila (columna `status`):
 *
 *   `draft`     -> nunca se publico: la tienda no la sirve.
 *   `published` -> `content_json` esta vivo para todo el mundo.
 *   `private`   -> `content_json` vivo, pero solo para quien trae sesion de
 *                  editor (viene del ERP). El publico normal recibe 404.
 *   `scheduled` -> programada: se sirve cuando `scheduled_at` <= ahora
 *                  (perezoso, sin cron). Antes de la fecha se comporta como un
 *                  borrador de cara al publico.
 *   `trash`     -> en la papelera: ninguna ruta la muestra.
 */
export type VisualEditStatus =
  | "draft"
  | "published"
  | "private"
  | "scheduled"
  | "trash"

export interface VisualEditRecord {
  id: number
  title: string
  slug: string
  content_json: string | null
  type: "page" | "header" | "footer" | "home" | "block" | "modal"
  /**
   * Los campos de borrador los rellena la funcion privada (`/api/editor/*`).
   * La publica solo devuelve lo publicado y no los manda, asi que un registro
   * que venga de `loadPageResult` los trae en `undefined` por mucho que el tipo
   * diga otra cosa: por eso el editor lee por `loadEditorPageResult`.
   */
  status: VisualEditStatus
  /**
   * Copia de trabajo. Con el modelo nuevo esta SIEMPRE presente (no vuelve a
   * NULL tras publicar): al publicar se iguala a `content_json`. "Sin cambios
   * pendientes" es `draft_json === content_json`, no `draft_json === null`.
   */
  draft_json: string | null
  published_at: string | null
  /** Fecha de publicacion programada; solo en filas `scheduled`. */
  scheduled_at?: string | null
  /** Soft delete: false = la fila no existe para nadie (no llega a los listados). */
  is_active?: boolean
  /** El listado no manda los JSON; manda esto (draft_json != content_json). */
  has_draft?: boolean
  has_pending_draft?: boolean
  draft_updated_at?: string | null
  updated_at: string
  updated_by: string
  created_at: string
  created_by: string
}

/**
 * Si hay trabajo guardado sin publicar.
 *
 * Mira primero el booleano calculado porque es lo unico que trae el listado, y
 * cae a `draft_json` para la fila completa y para el hueco entre despliegues,
 * cuando la funcion todavia no calcula `has_draft`.
 */
export interface PublishStateFields {
  status: VisualEditStatus
  scheduled_at?: string | null
  has_draft?: boolean
  has_pending_draft?: boolean
  draft_json?: string | null
  content_json?: string | null
}

/**
 * Si hay cambios guardados sin publicar (draft_json != content_json). El
 * listado lo manda ya calculado en `has_draft`/`has_pending_draft`; para la fila
 * completa se compara, ya que `draft_json` siempre viene poblado.
 */
export function hasPendingDraft(record: PublishStateFields): boolean {
  if (typeof record.has_draft === "boolean") return record.has_draft
  if (typeof record.has_pending_draft === "boolean") return record.has_pending_draft
  return (record.draft_json ?? null) !== (record.content_json ?? null)
}

/**
 * El estado efectivo de cara al publico. Una programada cuya fecha ya paso esta
 * viva, asi que cuenta como `published` aunque en la base siga como `scheduled`
 * (la publicacion es perezosa, sin cron).
 */
export function effectiveStatus(
  record: PublishStateFields,
  now: number = Date.now()
): VisualEditStatus {
  if (record.status === "scheduled") {
    const t = record.scheduled_at ? Date.parse(record.scheduled_at) : NaN
    return !Number.isNaN(t) && t <= now ? "published" : "scheduled"
  }
  return record.status
}

/**
 * El estado que se le ensena a quien edita: uno de los cinco, ya resuelto por
 * fecha. El matiz "tiene cambios sin publicar" va aparte, en `hasPendingDraft`.
 */
export type PublishState = VisualEditStatus

export function resolvePublishState(
  record: PublishStateFields,
  now?: number
): PublishState {
  return effectiveStatus(record, now)
}

/** Como se presenta el popup en pantalla. Ver lib/popup-presets.ts. */
export type PopupPresentation =
  | "modal"
  | "sheet"
  | "bottomSheet"
  | "bar"
  | "slideIn"
  | "fullscreen"

/**
 * Lado o esquina donde se ancla. Cada presentacion admite solo algunos (el
 * panel lateral, izquierda o derecha; la barra, arriba o abajo...) y las que no
 * se anclan lo ignoran.
 */
export type PopupSide =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

export type PopupShadow = "none" | "sm" | "md" | "lg"

/** "auto" es la de cada presentacion: el modal crece, el panel se desliza... */
export type PopupAnimation = "auto" | "none" | "fade" | "zoom" | "slide"

export interface ModalConfig {
  /** La de escritorio; tableta y celular la heredan si no traen la suya. */
  presentation: PopupPresentation
  /** "" hereda del modo mayor, como las medidas por modo de los bloques. */
  presentationTablet: PopupPresentation | ""
  presentationMobile: PopupPresentation | ""
  side: PopupSide
  sideTablet: PopupSide | ""
  sideMobile: PopupSide | ""
  overlay: boolean
  /** Con su opacidad dentro (rgba), como cualquier ColorField. */
  overlayColor: string
  /**
   * Formato anterior: la opacidad iba aparte. Se multiplica por el alfa de
   * `overlayColor`; el panel la deja en 100 al elegir un color.
   */
  overlayOpacity: number
  /** Desenfoque de la pagina detras, en px. 0 = sin desenfoque. */
  overlayBlur: number
  trigger: "onLoad" | "onButtonClick" | "onScroll" | "onExitIntent"
  triggerDelay: number
  triggerUrl: string
  triggerButtonClass: string
  triggerScrollPercent: number
  showOnce: boolean
  showCloseButton: boolean
  closeOnOverlay: boolean
  closeOnEsc: boolean
  lockScroll: boolean
  /** Segundos hasta cerrarse solo. 0 = nunca. */
  autoCloseSeconds: number
  animation: PopupAnimation
  /** En ms. */
  animationDuration: number
  shadow: PopupShadow
  /**
   * El marco del popup con los mismos nombres que usan los bloques: medidas,
   * bordes, fondo, CSS propio y visibilidad por dispositivo. Asi el panel
   * reusa las secciones compartidas y la tienda sus mismas reglas.
   */
  style: Record<string, unknown>
  // Formato anterior del marco, un texto CSS para los tres modos. Solo se lee
  // mientras `style` no tenga su medida (ver lib/popup-presets.ts).
  width?: string
  maxWidth?: string
  height?: string
  maxHeight?: string
  borderRadius?: string
}

export interface ModalContentJson {
  config: ModalConfig
  content: string
}

// Sin medidas: las pone la presentacion al crearlo (ver withPresentation), y
// un modal anterior trae las suyas en el formato anterior.
export const defaultModalConfig: ModalConfig = {
  presentation: "modal",
  presentationTablet: "",
  presentationMobile: "",
  side: "right",
  sideTablet: "",
  sideMobile: "",
  overlay: true,
  overlayColor: "rgba(0, 0, 0, 0.5)",
  overlayOpacity: 100,
  overlayBlur: 0,
  trigger: "onLoad",
  triggerDelay: 2000,
  triggerUrl: "",
  triggerButtonClass: "",
  triggerScrollPercent: 50,
  showOnce: false,
  showCloseButton: true,
  closeOnOverlay: true,
  closeOnEsc: true,
  lockScroll: true,
  autoCloseSeconds: 0,
  animation: "auto",
  animationDuration: 300,
  shadow: "lg",
  style: {},
}

/**
 * Completa una config guardada con los valores por defecto.
 *
 * Los modales anteriores a las presentaciones traen `position` en vez de
 * `presentation`/`side`: izquierda y derecha eran de hecho un panel lateral, y
 * arriba y abajo una barra, asi que se traducen a eso.
 */
export function normalizeModalConfig(
  raw: Partial<ModalConfig> & { position?: string }
): ModalConfig {
  const { position, ...rest } = raw
  const config: ModalConfig = {
    ...defaultModalConfig,
    ...rest,
    // Los anteriores guardaban la opacidad aparte y el color sin ella.
    overlayColor: rest.overlayColor ?? "#000000",
    overlayOpacity: rest.overlayOpacity ?? 100,
    style: { ...(rest.style ?? {}) },
  }

  if (!raw.presentation && position) {
    if (position === "left" || position === "right") {
      config.presentation = "sheet"
      config.side = position
    } else if (position === "top" || position === "bottom") {
      config.presentation = "bar"
      config.side = position
    }
  }

  return config
}

export function encodeModalContentJson(config: ModalConfig, craftJson: string): string {
  const wrapper: ModalContentJson = { config, content: craftJson }
  return JSON.stringify(wrapper)
}

export function decodeModalContentJson(raw: string): ModalContentJson | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && "config" in parsed && "content" in parsed) {
      return {
        config: normalizeModalConfig(parsed.config ?? {}),
        content: parsed.content,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Que hace el POST con lo que se le manda:
 *
 *   `draft`         -> escribe `draft_json`; no toca lo publicado
 *   `publish`       -> `content_json` = lo enviado y borra el borrador
 *   `discard_draft` -> borra el borrador; ignora `contentJson`
 *
 * La funcion asume `publish` si no llega ninguno, por compatibilidad con la
 * rama `mayorista`, que consume las mismas funciones sin saber de borradores.
 * Desde aqui va siempre explicito: el que antes era el unico comportamiento es
 * justo el destructivo.
 */
export type SaveMode =
  | "draft"
  | "publish"
  | "private"
  | "schedule"
  | "discard_draft"
  | "unpublish"
  | "trash"
  | "restore"
  | "soft_delete"

type SavePagePayload = {
  slug: string
  title: string
  /**
   * Opcional para `publish`/`private`/`schedule`: sin el, la funcion promueve lo
   * que ya tenga guardado la fila (primero el borrador, y si no lo hay, lo ultimo
   * publicado). Eso es lo que permite publicar desde el listado, sin abrir el
   * editor ni tener el lienzo en memoria.
   */
  contentJson?: string
  type: VisualEditRecord["type"]
  mode: SaveMode
  /** Solo para `schedule`: cuando debe pasar a publica, en ISO. */
  scheduledAt?: string
}

// ERP: las comprobaciones de StoreResult van con `result.ok === true/false` y
// no con `if (result.ok)`: el ERP compila sin strictNullChecks y ahi TypeScript
// no estrecha la union por veracidad.

/**
 * ERP: en el ecommerce esto iba a los route handlers de Next (`/api/editor/*`,
 * `/api/pages/*`), que a su vez llamaban a la edge function. Aquí se llama
 * directo a `ec-visual-edits` con la sesión del ERP y el canal en `x-channel-id`.
 * Se conservan las rutas de entrada para que el resto del archivo siga igual que
 * en la tienda; esta función las traduce.
 *
 * `invokeFunction` no expone el status HTTP, así que se reconstruye del cuerpo
 * de error. Solo `{"error":"not_found"}` es un 404: si "canal no encontrado"
 * contara también, el editor creería que la página es nueva y abriría un lienzo
 * vacío encima de la real.
 */
function rutaDeFuncion(input: string): string {
  const conSlug = (slug: string) => `ec-visual-edits?slug=${encodeURIComponent(slug)}`
  if (input.startsWith("/api/editor/pages/")) {
    return conSlug(decodeURIComponent(input.slice("/api/editor/pages/".length)))
  }
  if (input.startsWith("/api/editor/pages")) {
    return `ec-visual-edits${input.slice("/api/editor/pages".length)}`
  }
  if (input.startsWith("/api/pages/")) {
    return conSlug(decodeURIComponent(input.slice("/api/pages/".length)))
  }
  throw new Error(`Ruta del editor sin traducir: ${input}`)
}

function statusDeError(error: unknown): number {
  if (!(error instanceof FunctionError)) return 500
  if (error.code === "network_error") return 0
  const body = (error.body ?? {}) as Record<string, unknown>
  if (body.error === "not_found") return 404
  if (body.error === "unauthorized" || body.error === "forbidden") return 401
  // 401 del gateway (verify_jwt) o del resolver: sesión caída o sin usuario.
  const texto = String(body.error ?? body.msg ?? body.message ?? "")
  if (/jwt|token|usuario del erp/i.test(texto)) return 401
  return 500
}

async function requestJson<T>(
  input: string,
  init?: RequestInit
): Promise<{ data: T | null; status: number }> {
  try {
    const method = (init?.method ?? "GET") as "GET" | "POST" | "DELETE"
    const data = await invokeFunction<T>(rutaDeFuncion(input), {
      method,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      headers: editorChannelHeaders(),
    })
    return { data, status: 200 }
  } catch (error) {
    const status = statusDeError(error)
    if (status !== 404) console.error("Request failed:", error)
    return { data: null, status }
  }
}

export type StoreFailureReason = "unauthorized" | "notFound" | "error"

export type StoreResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: StoreFailureReason; status: number }

function toFailure(status: number): { ok: false; reason: StoreFailureReason; status: number } {
  if (status === 401) return { ok: false, reason: "unauthorized", status }
  if (status === 404) return { ok: false, reason: "notFound", status }
  return { ok: false, reason: "error", status }
}

async function postEditorPage(
  payload: SavePagePayload
): Promise<StoreResult<VisualEditRecord>> {
  const { data, status } = await requestJson<VisualEditRecord>(
    "/api/editor/pages",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )

  if (!data) {
    return toFailure(status)
  }

  return { ok: true, data }
}

export function savePageResult(
  slug: string,
  title: string,
  contentJson: string,
  type: VisualEditRecord["type"],
  mode: SaveMode
): Promise<StoreResult<VisualEditRecord>> {
  return postEditorPage({ slug, title, contentJson, type, mode })
}

/** Guarda sin publicar: la tienda sigue sirviendo lo de antes. */
export function saveDraftResult(
  slug: string,
  title: string,
  contentJson: string,
  type: VisualEditRecord["type"]
): Promise<StoreResult<VisualEditRecord>> {
  return savePageResult(slug, title, contentJson, type, "draft")
}

/** Lo enviado pasa a ser lo que ve el publico, y el borrador se descarta. */
export function publishPageResult(
  slug: string,
  title: string,
  contentJson: string,
  type: VisualEditRecord["type"]
): Promise<StoreResult<VisualEditRecord>> {
  return savePageResult(slug, title, contentJson, type, "publish")
}

/**
 * Publicar sin mandar contenido, para el listado: la funcion promueve lo que ya
 * tenga la fila —el borrador si lo hay, y si no lo ultimo que estuvo publicado,
 * que es el caso de algo despublicado—. Asi se publica sin abrir el editor.
 */
export function publishStoredResult(
  slug: string,
  title: string,
  type: VisualEditRecord["type"]
): Promise<StoreResult<VisualEditRecord>> {
  return postEditorPage({ slug, title, type, mode: "publish" })
}

/**
 * Saca la fila del sitio en vivo sin perderla: pasa a `draft` conservando
 * `content_json`, asi que volver a publicarla devuelve exactamente lo que
 * habia.
 */
export function unpublishPageResult(
  slug: string,
  title: string,
  type: VisualEditRecord["type"]
): Promise<StoreResult<VisualEditRecord>> {
  return postEditorPage({ slug, title, type, mode: "unpublish" })
}

/**
 * Publicar como privada: content_json vivo pero solo para sesiones de editor.
 * Con contenido (desde el editor) publica ese; sin el (desde el listado)
 * promueve lo que ya tenga la fila.
 */
export function publishPrivateResult(
  slug: string,
  title: string,
  type: VisualEditRecord["type"],
  contentJson?: string
): Promise<StoreResult<VisualEditRecord>> {
  return postEditorPage({ slug, title, type, mode: "private", contentJson })
}

/**
 * Programar: se publica sola cuando llega `scheduledAt`. Con contenido (editor)
 * programa ese; sin el (listado) programa lo que ya tenga la fila.
 */
export function schedulePageResult(
  slug: string,
  title: string,
  type: VisualEditRecord["type"],
  scheduledAt: string,
  contentJson?: string
): Promise<StoreResult<VisualEditRecord>> {
  return postEditorPage({ slug, title, type, mode: "schedule", scheduledAt, contentJson })
}

/** Mueve la fila a la papelera. Sigue existiendo, pero ninguna ruta la muestra. */
export function trashPageResult(
  slug: string,
  title: string,
  type: VisualEditRecord["type"]
): Promise<StoreResult<VisualEditRecord>> {
  return postEditorPage({ slug, title, type, mode: "trash" })
}

/** Saca la fila de la papelera; vuelve a Borrador. */
export function restorePageResult(
  slug: string,
  title: string,
  type: VisualEditRecord["type"]
): Promise<StoreResult<VisualEditRecord>> {
  return postEditorPage({ slug, title, type, mode: "restore" })
}

/**
 * Eliminar de verdad desde la papelera: soft delete (is_active=false). La fila
 * se conserva pero desaparece de todo. La respuesta es `{ success: true }`, no
 * un registro, asi que se envuelve aparte.
 */
export async function softDeletePageResult(
  slug: string,
  title: string,
  type: VisualEditRecord["type"]
): Promise<StoreResult<{ success: true }>> {
  const { data, status } = await requestJson<{ success: boolean }>(
    "/api/editor/pages",
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, type, mode: "soft_delete" }),
    }
  )

  if (!data?.success) {
    return toFailure(status)
  }

  return { ok: true, data: { success: true } }
}

/**
 * Tira el borrador y deja viva la ultima version publicada.
 *
 * `title` y `type` son opcionales porque el modo no los necesita, pero el
 * cuerpo del POST los lleva igual: mandando los actuales, si la funcion los
 * escribiera de todas formas, los reescribe con lo que ya hay.
 */
export function discardDraftResult(
  slug: string,
  title?: string,
  type: VisualEditRecord["type"] = "page"
): Promise<StoreResult<VisualEditRecord>> {
  return savePageResult(slug, title ?? slug, "", type, "discard_draft")
}

// La respuesta de una sola fila puede no serlo: la version anterior de la edge
// function ignora el `?slug=` y responde el array completo del canal. Sin esto,
// en el hueco entre despliegues el editor leeria un array como si fuera el
// registro, abriria con el canvas vacio y publicar encima borraria la pagina.
function isVisualEditRecord(value: unknown): value is VisualEditRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "slug" in value &&
    "id" in value
  )
}

/**
 * La lectura del EDITOR: trae la fila entera, incluido el borrador.
 *
 * Va por la ruta autenticada a proposito. La publica filtra por
 * `status='published'`, asi que por ahi el editor no podria abrir ni sus
 * propios borradores ni las paginas recien creadas.
 */
export async function loadEditorPageResult(
  slug: string
): Promise<StoreResult<VisualEditRecord>> {
  const { data, status } = await requestJson<VisualEditRecord | VisualEditRecord[]>(
    `/api/editor/pages?slug=${encodeURIComponent(slug)}`,
    {
      method: "GET",
      credentials: "include",
    }
  )

  if (!data) {
    return toFailure(status)
  }

  if (Array.isArray(data)) {
    const encontrado = data.find((record) => record.slug === slug)
    if (!encontrado) return { ok: false, reason: "notFound", status: 404 }
    return { ok: true, data: encontrado }
  }

  // Ni fila ni array: no se sabe que hay en la pagina, y "error" es lo unico
  // que deja al editor mostrar su pantalla de fallo en vez de un canvas vacio.
  if (!isVisualEditRecord(data)) {
    console.error("Error loading editor page: unexpected response")
    return { ok: false, reason: "error", status }
  }

  return { ok: true, data }
}

/**
 * Lo que devuelve la ruta publica, que no es la fila entera: la edge function
 * declara sus columnas una a una y deja fuera el borrador (lo no publicado no
 * sale por una ruta sin autenticar) y de paso los uuid de quien la toco.
 *
 * El tipo lo dice en vez de prometer campos que llegarian en `undefined`: asi
 * leer `record.draft_json` desde la tienda es un error de compilacion y no una
 * rotura silenciosa el dia que alguien lo intente.
 */
export type PublicVisualEditRecord = Omit<
  VisualEditRecord,
  "draft_json" | "updated_by" | "created_by"
>

/**
 * La lectura PUBLICA, la que usa la tienda: devuelve solo lo publicado. El
 * editor no debe pasar por aqui (ver `loadEditorPageResult`).
 */
export async function loadPageResult(
  slug: string
): Promise<StoreResult<PublicVisualEditRecord>> {
  const { data, status } = await requestJson<PublicVisualEditRecord>(
    `/api/pages/${encodeURIComponent(slug)}`,
    {
      method: "GET",
      credentials: "include",
    }
  )

  if (!data) {
    return toFailure(status)
  }

  return { ok: true, data }
}

export async function savePage(
  slug: string,
  title: string,
  contentJson: string,
  type: VisualEditRecord["type"] = "page",
  mode: SaveMode = "publish"
): Promise<VisualEditRecord | null> {
  const result = await savePageResult(slug, title, contentJson, type, mode)

  if (result.ok === false) {
    console.error("Error saving page: request failed")
    return null
  }

  return result.data
}

export async function loadPage(
  slug: string
): Promise<PublicVisualEditRecord | null> {
  const result = await loadPageResult(slug)

  if (result.ok === false) {
    if (result.reason !== "notFound") {
      console.error("Error loading page: request failed")
    }
    return null
  }

  return result.data
}

/**
 * Una fila del listado.
 *
 * NO es un `VisualEditRecord`: el listado no manda `content_json` ni
 * `draft_json`, que son con diferencia lo que mas pesa de la fila y no se
 * pintan en ningun sitio. Para tener el contenido hay que pedir la fila entera
 * con `loadEditorPageResult`.
 */
export interface VisualEditListItem {
  id: number
  title: string
  slug: string
  type: VisualEditRecord["type"]
  status: VisualEditStatus
  has_draft?: boolean
  published_at: string | null
  scheduled_at?: string | null
  draft_updated_at?: string | null
  updated_at: string
  updated_by: string
  created_at: string
  created_by: string
}

export interface ListPagesFilters {
  types?: VisualEditRecord["type"][]
  search?: string
  /** Sin esto entran todos los estados no-papelera. */
  status?: VisualEditStatus
  /** La vista de papelera: solo lo que esta en `trash`. */
  trash?: boolean
}

export interface ListPagesPageParams extends ListPagesFilters {
  page: number
  size: number
}

/** Cuantas filas hay de cada estado. Respeta `type` y `search`, ignora `status`
 *  a proposito: es lo que necesitan las pestanas para decir cuantas veria cada
 *  una sin tener que pedir las tres. */
export interface StatusCounts {
  all: number
  published: number
  draft: number
}

/** Cuantas filas hay de cada tipo. Solo respeta `search`: alimenta los
 *  contadores del menu lateral, que hablan de todo el canal y no de la seccion
 *  que se este mirando. */
export type TypeCounts = Partial<Record<VisualEditRecord["type"], number>>

export interface PagedPages {
  data: VisualEditListItem[]
  total: number
  page: number
  size: number
  counts?: StatusCounts
  type_counts?: TypeCounts
}

function buildListQuery(params: ListPagesFilters & { page?: number; size?: number }): string {
  const query = new URLSearchParams()

  if (params.types?.length) query.set("type", params.types.join(","))
  if (params.search?.trim()) query.set("search", params.search.trim())
  if (params.status) query.set("status", params.status)
  if (params.trash) query.set("trash", "1")
  if (params.page !== undefined) query.set("page", String(params.page))
  if (params.size !== undefined) query.set("size", String(params.size))

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ""
}

export async function listPages(
  filters: ListPagesFilters = {}
): Promise<VisualEditListItem[]> {
  const { data } = await requestJson<VisualEditListItem[]>(
    `/api/editor/pages${buildListQuery(filters)}`,
    {
      method: "GET",
      credentials: "include",
    }
  )

  if (!data) {
    console.error("Error listing pages: request failed")
    return []
  }

  return data
}

// Red de seguridad para el hueco entre despliegues: la version anterior de la
// edge function ignora los filtros y responde el array completo del canal. Sin
// esto el listado se veria vacio hasta que el backend se actualice.
function paginateLocally(
  records: VisualEditListItem[],
  params: ListPagesPageParams
): PagedPages {
  const term = params.search?.trim().toLowerCase() ?? ""

  const matchesSearch = (record: VisualEditListItem) =>
    term === "" ||
    record.title.toLowerCase().includes(term) ||
    record.slug.toLowerCase().includes(term)

  // La papelera es su propia vista; el resto de secciones la excluyen.
  const matchesTrash = (record: VisualEditListItem) =>
    params.trash ? record.status === "trash" : record.status !== "trash"

  const activos = records.filter(matchesTrash)

  // Los contadores del menu lateral solo miran la busqueda: hablan de todo el
  // canal, no de la seccion abierta.
  const type_counts: TypeCounts = {}
  for (const record of activos.filter(matchesSearch)) {
    type_counts[record.type] = (type_counts[record.type] ?? 0) + 1
  }

  // Las pestanas si miran el tipo, pero no el estado: cada una tiene que poder
  // decir cuantas filas veria.
  const delTipo = activos.filter(
    (record) =>
      (!params.types?.length || params.types.includes(record.type)) &&
      matchesSearch(record)
  )
  const counts: StatusCounts = {
    all: delTipo.length,
    published: delTipo.filter((record) => record.status === "published").length,
    draft: delTipo.filter((record) => record.status === "draft").length,
  }

  const filtered = params.status
    ? delTipo.filter((record) => record.status === params.status)
    : delTipo

  const from = (params.page - 1) * params.size

  return {
    data: filtered.slice(from, from + params.size),
    total: filtered.length,
    page: params.page,
    size: params.size,
    counts,
    type_counts,
  }
}

/**
 * Variante paginada: pedir `page`/`size` cambia la respuesta de la edge function
 * de un array a un objeto con el total, necesario para saber cuantas paginas hay.
 *
 * Devuelve `StoreResult` y no un listado vacio al fallar. Son dos cosas que el
 * listado tiene que pintar distinto: "aqui no hay nada, crea algo" y "no se
 * pudo cargar, reintenta". Devolviendo un vacio en los dos casos, un corte de
 * red se leia como una seccion vacia y se invitaba a crear encima.
 */
export async function listPagesPaged(
  params: ListPagesPageParams
): Promise<StoreResult<PagedPages>> {
  const { data, status } = await requestJson<PagedPages | VisualEditListItem[]>(
    `/api/editor/pages${buildListQuery(params)}`,
    {
      method: "GET",
      credentials: "include",
    }
  )

  if (!data) {
    console.error("Error listing pages: request failed")
    return toFailure(status)
  }

  if (Array.isArray(data)) {
    return { ok: true, data: paginateLocally(data, params) }
  }

  if (!Array.isArray(data.data)) {
    console.error("Error listing pages: unexpected response")
    return { ok: false, reason: "error", status }
  }

  return { ok: true, data }
}

export async function deletePage(slug: string): Promise<boolean> {
  const { status } = await requestJson<{ success: boolean }>(
    `/api/editor/pages/${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  )

  if (status !== 200) {
    console.error("Error deleting page: request failed")
    return false
  }

  return true
}

// El modal guarda el mismo envoltorio {config, content} vaya al borrador o a lo
// publicado: asi un borrador de modal se lee con el mismo decode y la config
// viaja con su contenido en vez de publicarse por su cuenta.
export async function saveModalResult(
  slug: string,
  title: string,
  config: ModalConfig,
  craftJson: string,
  mode: SaveMode
): Promise<StoreResult<VisualEditRecord>> {
  const contentJson = encodeModalContentJson(config, craftJson)
  return savePageResult(slug, title, contentJson, "modal", mode)
}

export function saveModalDraftResult(
  slug: string,
  title: string,
  config: ModalConfig,
  craftJson: string
): Promise<StoreResult<VisualEditRecord>> {
  return saveModalResult(slug, title, config, craftJson, "draft")
}

export function publishModalResult(
  slug: string,
  title: string,
  config: ModalConfig,
  craftJson: string
): Promise<StoreResult<VisualEditRecord>> {
  return saveModalResult(slug, title, config, craftJson, "publish")
}

export async function saveModal(
  slug: string,
  title: string,
  config: ModalConfig,
  craftJson: string,
  mode: SaveMode = "publish"
): Promise<VisualEditRecord | null> {
  const result = await saveModalResult(slug, title, config, craftJson, mode)

  if (result.ok === false) {
    console.error("Error saving modal: request failed")
    return null
  }

  return result.data
}

// Header y footer no tienen borrador propio: se guardan ya vivos, que es lo que
// hacian antes de que existieran los modos.
export async function saveConfig(
  type: "header" | "footer",
  contentJson: string
): Promise<VisualEditRecord | null> {
  return savePage(`__config_${type}`, `Config: ${type}`, contentJson, type, "publish")
}

export async function loadConfig(
  type: "header" | "footer"
): Promise<string | null> {
  const page = await loadPage(`__config_${type}`)
  return page?.content_json || null
}
