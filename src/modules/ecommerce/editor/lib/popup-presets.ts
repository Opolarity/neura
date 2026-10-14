// Las presentaciones de un popup (modal, panel lateral, barra...) y el CSS de
// su marco.
//
// El marco guarda sus medidas, bordes y fondo en `config.style` con los mismos
// nombres que los bloques del editor, asi que sus reglas son las de las
// secciones compartidas. Lo unico propio es lo que fija cada presentacion: un
// panel lateral mide siempre el alto de la pantalla, una barra el ancho.
//
// Aqui no van clases de Tailwind: lib/ no esta en el `content` de Tailwind y
// no se generarian. Las de posicion y animacion viven en modal-provider.tsx.

import type {
  ModalConfig,
  PopupAnimation,
  PopupPresentation,
  PopupShadow,
  PopupSide,
} from "@/modules/ecommerce/editor/lib/editor-store"
import type { Viewport } from "@/modules/ecommerce/editor/components/viewport-context"
import {
  HEIGHT_NAMING,
  MAX_HEIGHT_NAMING,
  MAX_WIDTH_NAMING,
  RADIUS_CORNER_KEYS,
  RADIUS_NAMING,
  WIDTH_NAMING,
  type MeasureNaming,
  type MeasureSpec,
  type RadiusCorner,
  type SidesSpec,
} from "@/modules/ecommerce/editor/components/box-measures"
import {
  measureFromCss,
  spacingRulesByViewport,
  type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import { borderRulesByViewport, type BorderLegacy } from "@/modules/ecommerce/editor/components/border-section"
import {
  appearanceRulesByViewport,
  type AppearanceLegacy,
} from "@/modules/ecommerce/editor/components/appearance-section"
import { compileCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { parseColor, rgbaToString } from "@/modules/ecommerce/editor/components/color-field"

export const POPUP_VIEWPORTS: Viewport[] = ["desktop", "tablet", "mobile"]

interface PopupPreset {
  label: string
  description: string
  /** Lados o esquinas que admite; vacio si no se ancla a ninguno. */
  sides: { value: PopupSide; label: string }[]
  /**
   * Que medidas tienen sentido. Las demas las fija la presentacion (ver
   * forcedRulesOf) y el panel no las enseña.
   */
  sizing: { width: boolean; height: boolean }
  /** Comportamiento que se aplica al elegirla en escritorio. */
  defaults: Partial<ModalConfig>
  /** Medidas de escritorio que se aplican al elegirla, en `style`. */
  style: Record<string, unknown>
}

function measure(naming: MeasureNaming, spec: MeasureSpec): Record<string, unknown> {
  return {
    [naming.value("Desktop")]: spec.value,
    [naming.unit("Desktop")]: spec.unit,
    [naming.custom("Desktop")]: spec.custom,
  }
}

function radius(value: number): Record<string, unknown> {
  const out: Record<string, unknown> = {
    [RADIUS_NAMING.unit("Desktop")]: "px",
    [RADIUS_NAMING.custom("Desktop")]: "",
  }
  for (const corner of RADIUS_CORNER_KEYS) out[RADIUS_NAMING.value(corner, "Desktop")] = value
  return out
}

const px = (value: number): MeasureSpec => ({ value, unit: "px", custom: "" })
const css = (text: string): MeasureSpec => ({ value: undefined, unit: "custom", custom: text })
const AUTO: MeasureSpec = { value: undefined, unit: "auto", custom: "" }

export const POPUP_PRESETS: Record<PopupPresentation, PopupPreset> = {
  modal: {
    label: "Modal centrado",
    description: "Ventana en el centro de la pantalla. Para promociones, avisos o cupones.",
    sides: [],
    sizing: { width: true, height: true },
    defaults: { overlay: true, closeOnOverlay: true, lockScroll: true },
    style: {
      ...measure(WIDTH_NAMING, px(600)),
      ...measure(MAX_WIDTH_NAMING, css("90vw")),
      ...measure(HEIGHT_NAMING, AUTO),
      ...measure(MAX_HEIGHT_NAMING, css("90vh")),
      ...radius(16),
    },
  },
  sheet: {
    label: "Panel lateral",
    description: "Entra desde un costado y ocupa todo el alto. Para guías de tallas, filtros o ayuda.",
    sides: [
      { value: "right", label: "Derecha" },
      { value: "left", label: "Izquierda" },
    ],
    sizing: { width: true, height: false },
    defaults: { side: "right", overlay: true, closeOnOverlay: true, lockScroll: true },
    style: {
      ...measure(WIDTH_NAMING, px(400)),
      ...measure(MAX_WIDTH_NAMING, css("90vw")),
      ...radius(0),
    },
  },
  bottomSheet: {
    label: "Hoja inferior",
    description: "Sube desde abajo y se cierra arrastrando. Pensada para celulares.",
    sides: [],
    sizing: { width: false, height: true },
    defaults: { overlay: true, closeOnOverlay: true, lockScroll: true },
    style: {
      ...measure(HEIGHT_NAMING, AUTO),
      ...measure(MAX_HEIGHT_NAMING, css("85vh")),
      ...radius(16),
    },
  },
  bar: {
    label: "Barra",
    description: "Franja de todo el ancho arriba o abajo, sin tapar la página. Para envíos gratis o cookies.",
    sides: [
      { value: "top", label: "Arriba" },
      { value: "bottom", label: "Abajo" },
    ],
    sizing: { width: false, height: true },
    defaults: { side: "top", overlay: false, closeOnOverlay: false, lockScroll: false },
    style: {
      ...measure(HEIGHT_NAMING, AUTO),
      ...measure(MAX_HEIGHT_NAMING, css("50vh")),
      ...radius(0),
    },
  },
  slideIn: {
    label: "Aviso en esquina",
    description: "Caja pequeña en una esquina que deja usar la página. Para newsletter o ayuda.",
    sides: [
      { value: "bottom-right", label: "Abajo a la derecha" },
      { value: "bottom-left", label: "Abajo a la izquierda" },
      { value: "top-right", label: "Arriba a la derecha" },
      { value: "top-left", label: "Arriba a la izquierda" },
    ],
    sizing: { width: true, height: true },
    defaults: { side: "bottom-right", overlay: false, closeOnOverlay: false, lockScroll: false },
    style: {
      ...measure(WIDTH_NAMING, px(360)),
      ...measure(MAX_WIDTH_NAMING, css("calc(100vw - 32px)")),
      ...measure(HEIGHT_NAMING, AUTO),
      ...measure(MAX_HEIGHT_NAMING, css("70vh")),
      ...radius(16),
    },
  },
  fullscreen: {
    label: "Pantalla completa",
    description: "Cubre toda la pantalla. Para lanzamientos o lookbooks.",
    sides: [],
    sizing: { width: false, height: false },
    defaults: { overlay: false, closeOnOverlay: false, lockScroll: true },
    style: {},
  },
}

export const POPUP_PRESENTATIONS = Object.keys(POPUP_PRESETS) as PopupPresentation[]

/**
 * Elige la presentacion de escritorio con sus valores por defecto: el
 * comportamiento y las medidas de escritorio. Tableta y celular solo cambian
 * la presentacion (ver presentationFor), sin tocar lo demas.
 */
export function withPresentation(
  config: ModalConfig,
  presentation: PopupPresentation
): ModalConfig {
  const preset = POPUP_PRESETS[presentation]
  return {
    ...config,
    ...preset.defaults,
    presentation,
    style: { ...config.style, ...preset.style },
  }
}

const PRESENTATION_KEY = { tablet: "presentationTablet", mobile: "presentationMobile" } as const
const SIDE_KEY = { tablet: "sideTablet", mobile: "sideMobile" } as const

/** Lo que el modo guarda como propio: "" en los que heredan. */
export function ownPresentationOf(config: ModalConfig, viewport: Viewport) {
  return viewport === "desktop" ? config.presentation : config[PRESENTATION_KEY[viewport]]
}

export function ownSideOf(config: ModalConfig, viewport: Viewport) {
  return viewport === "desktop" ? config.side : config[SIDE_KEY[viewport]]
}

/** La presentacion de un modo, heredada del mayor si no tiene la suya. */
export function presentationFor(config: ModalConfig, viewport: Viewport): PopupPresentation {
  const tablet = config.presentationTablet || config.presentation
  if (viewport === "desktop") return config.presentation
  if (viewport === "tablet") return tablet
  return config.presentationMobile || tablet
}

/**
 * El lado efectivo de un modo: el suyo o el heredado, si la presentacion de ese
 * modo lo admite, y si no el primero de los suyos. Cambiar de barra a panel
 * lateral deja un `side: "top"` que el panel no sabria pintar.
 */
export function sideFor(config: ModalConfig, viewport: Viewport): PopupSide | undefined {
  const { sides } = POPUP_PRESETS[presentationFor(config, viewport)]
  if (sides.length === 0) return undefined
  const tablet = config.sideTablet || config.side
  const own = viewport === "desktop" ? config.side : viewport === "tablet" ? tablet : config.sideMobile || tablet
  return sides.some((s) => s.value === own) ? own : sides[0].value
}

/** El modo que toca segun el ancho real del navegador, con los breakpoints del editor. */
export function viewportOfWidth(width: number): Viewport {
  if (width < 768) return "mobile"
  if (width < 1024) return "tablet"
  return "desktop"
}

export function isPopupHiddenOn(config: ModalConfig, viewport: Viewport) {
  const key =
    viewport === "desktop" ? "hiddenOnDesktop" : viewport === "tablet" ? "hiddenOnTablet" : "hiddenOnMobile"
  return Boolean(config.style[key])
}

// ── Formato anterior ────────────────────────────────────────────────────────

function sameInAll(text: string | undefined): SpacingLegacy["width"] {
  if (!text) return undefined
  const spec = measureFromCss(text)
  return { desktop: spec, tablet: spec, mobile: spec }
}

/** Las medidas de un popup anterior, que eran un texto para los tres modos. */
export function popupSpacingLegacy(config: ModalConfig): SpacingLegacy {
  return {
    width: sameInAll(config.width),
    maxWidth: sameInAll(config.maxWidth),
    height: sameInAll(config.height),
    maxHeight: sameInAll(config.maxHeight),
  }
}

export function popupBorderLegacy(config: ModalConfig): BorderLegacy {
  if (!config.borderRadius) return {}
  const spec = measureFromCss(config.borderRadius)
  const sides = {} as Partial<Record<RadiusCorner, number | undefined>>
  for (const corner of RADIUS_CORNER_KEYS) sides[corner] = spec.value
  const legacyRadius: SidesSpec<RadiusCorner> =
    spec.unit === "custom"
      ? { sides: {}, unit: "custom", custom: spec.custom }
      : { sides, unit: spec.unit, custom: "" }
  return { radius: legacyRadius, radiusValueFor: () => spec.value }
}

/**
 * Sin fondo propio el popup es blanco, como siempre lo fue: el color plano por
 * defecto de la seccion es transparente y dejaria ver la pagina detras.
 */
export const POPUP_APPEARANCE_LEGACY: AppearanceLegacy = {
  backgroundType: "color",
  background: "#ffffff",
}

/** El color del fondo de pagina con la opacidad del formato anterior ya dentro. */
export function overlayColorOf(config: ModalConfig) {
  const color = parseColor(config.overlayColor)
  return rgbaToString({ ...color, a: color.a * ((config.overlayOpacity ?? 100) / 100) })
}

// ── Sombra y animacion ──────────────────────────────────────────────────────

export const POPUP_SHADOWS: Record<PopupShadow, { label: string; css: string }> = {
  none: { label: "Ninguna", css: "none" },
  sm: { label: "Suave", css: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)" },
  md: { label: "Media", css: "0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" },
  lg: { label: "Fuerte", css: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" },
}

export const POPUP_ANIMATIONS: { value: PopupAnimation; label: string }[] = [
  { value: "auto", label: "Automática (según la presentación)" },
  { value: "fade", label: "Fundido" },
  { value: "zoom", label: "Zoom" },
  { value: "slide", label: "Deslizar" },
  { value: "none", label: "Ninguna" },
]

// ── CSS del marco ───────────────────────────────────────────────────────────

/**
 * Lo que la presentacion deja al contenido cuando el popup no dice nada: el
 * alto que se ajusta a lo que lleva dentro. Va antes de las reglas propias.
 */
function baseRulesOf(presentation: PopupPresentation) {
  return presentation === "sheet" || presentation === "fullscreen" ? "" : "height: fit-content;"
}

/**
 * Lo que la presentacion fija por encima de lo que diga el popup. Con
 * !important porque la presentacion puede cambiar por modo y las medidas se
 * heredan: un ancho de 600px de escritorio no debe estrechar la hoja inferior
 * del celular.
 */
export function forcedRulesOf(presentation: PopupPresentation) {
  switch (presentation) {
    case "sheet":
      return "height: 100% !important; min-height: 0 !important; max-height: none !important;"
    case "bottomSheet":
      return (
        "width: 100% !important; min-width: 0 !important; max-width: none !important;" +
        "border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important;"
      )
    case "bar":
      return "width: 100% !important; min-width: 0 !important; max-width: none !important;"
    case "fullscreen":
      return (
        "width: 100% !important; height: 100% !important;" +
        "min-width: 0 !important; min-height: 0 !important;" +
        "max-width: none !important; max-height: none !important; border-radius: 0 !important;"
      )
    default:
      return ""
  }
}

/** Las reglas del marco por modo: las de las secciones y las de su presentacion. */
export function surfaceRulesByViewport(config: ModalConfig): Record<Viewport, string> {
  const spacing = spacingRulesByViewport(config.style, popupSpacingLegacy(config))
  const border = borderRulesByViewport(config.style, popupBorderLegacy(config))
  const fondo = appearanceRulesByViewport(config.style, POPUP_APPEARANCE_LEGACY)
  const of = (viewport: Viewport) => {
    const presentation = presentationFor(config, viewport)
    return (
      baseRulesOf(presentation) +
      spacing[viewport] +
      border[viewport] +
      fondo[viewport].fondo +
      forcedRulesOf(presentation)
    )
  }
  return { desktop: of("desktop"), tablet: of("tablet"), mobile: of("mobile") }
}

/** Si algun modo pide video de fondo: solo entonces se monta el <video>. */
export function surfaceVideoUrl(config: ModalConfig) {
  const url = (config.style.backgroundVideoUrl as string | undefined) ?? ""
  if (!url) return ""
  const fondo = appearanceRulesByViewport(config.style, POPUP_APPEARANCE_LEGACY)
  return POPUP_VIEWPORTS.some((v) => !fondo[v].video.includes("display: none")) ? url : ""
}

/**
 * El `<style>` del marco. Con `viewport` (el editor) solo ese modo; sin el (la
 * tienda) los tres con sus media queries. La clase va doble para ganarle a las
 * utilidades de Tailwind del propio marco.
 */
export function surfaceCss(
  config: ModalConfig,
  className: string,
  videoClassName: string,
  viewport: Viewport | null
) {
  const rules = surfaceRulesByViewport(config)
  const video = appearanceRulesByViewport(config.style, POPUP_APPEARANCE_LEGACY)
  const block = (v: Viewport) =>
    `.${className}.${className} { ${rules[v]} } .${videoClassName} { ${video[v].video} }`
  const custom = compileCustomCss(config.style.customCss as string | undefined, className)

  if (viewport) return block(viewport) + custom
  return (
    `@media (max-width: 767px) { ${block("mobile")} }` +
    `@media (min-width: 768px) and (max-width: 1023px) { ${block("tablet")} }` +
    `@media (min-width: 1024px) { ${block("desktop")} }` +
    custom
  )
}
