import { lazy, Suspense } from "react"
import { useEditor } from "@craftjs/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { cn } from "@/shared/utils/utils"
import { useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { DEFAULT_ICON_KEY } from "@/modules/ecommerce/editor/lib/icon-loader"
import { useIconDefinition } from "@/modules/ecommerce/editor/hooks/use-icon-definition"
import {
  popupDataAttributes,
  popupTargetOf,
  type PopupLinkAction,
} from "@/modules/ecommerce/editor/components/link-section"
import {
  useTypographyCss,
  type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import {
  useAppearance,
  type AppearanceLegacy,
} from "@/modules/ecommerce/editor/components/appearance-section"
import {
  useBorderCss,
  uniformSides,
  type BorderLegacy,
} from "@/modules/ecommerce/editor/components/border-section"
import {
  RADIUS_CORNER_KEYS,
  type BorderStyle,
  type MeasureSpec,
} from "@/modules/ecommerce/editor/components/box-measures"
import {
  useSpacingCss,
  uniformSpacing,
  type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"

// El panel trae el buscador con el catalogo entero de FontAwesome (~515 KB gz):
// cargado aparte, abrir el editor no lo descarga. Ver editable-icon-settings.tsx.
const LazyEditableIconSettings = lazy(() =>
  import("./editable-icon-settings").then((m) => ({ default: m.EditableIconSettings })),
)

function EditableIconSettings() {
  return (
    <Suspense fallback={null}>
      <LazyEditableIconSettings />
    </Suspense>
  )
}

export interface EditableIconProps {
  icon?: string
  /**
   * @deprecated El tamaño del icono en px. Se sigue leyendo porque lo traen
   * los iconos ya publicados; hoy el tamaño va en `size{Modo}` de
   * TypographySection y esto solo alimenta su `legacy`.
   */
  iconSize?: number
  /**
   * @deprecated El color del icono. Mismo motivo que `iconSize`: hoy es
   * `textColor`.
   */
  iconColor?: string
  /**
   * @deprecated El fondo del icono. Mismo motivo que `iconSize`, con el
   * `legacy` de AppearanceSection, donde hoy se llama `background`.
   */
  backgroundColor?: string
  /**
   * @deprecated El radio uniforme anterior. Mismo motivo que `iconSize`,
   * con el `legacy` de BorderSection.
   */
  borderRadius?: number
  borderStyle?: BorderStyle
  borderColor?: string
  href?: string
  openInNewTab?: boolean
  /** Sin valor es "url", como los ya publicados. Ver LinkSection. */
  linkType?: "url" | "popup"
  popupSlug?: string
  popupAction?: PopupLinkAction
  customClass?: string
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string
  hiddenOnDesktop?: boolean
  hiddenOnTablet?: boolean
  hiddenOnMobile?: boolean
  [key: string]: unknown
}

// El unico relleno de antes era fijo: 8px alrededor del icono. Pasa a legado
// para que la seccion lo enseñe y el usuario pueda cambiarlo.
export const spacingLegacy: SpacingLegacy = {
  padding: uniformSpacing(8),
  paddingValueFor: () => 8,
}

/**
 * El tamaño y el color que el icono guardaba por su cuenta, leidos como lo que
 * son: la letra del bloque. `iconSize` era un numero de px y `iconColor` un
 * color, y los dos valian para los tres modos de pantalla, asi que se repiten
 * en los tres para que ninguno se cuele con lo guardado.
 *
 * Vive fuera de los dos componentes porque el panel y el render lo necesitan
 * igual y cada uno lee las props por su cuenta.
 */
export function typographyLegacyOf(props: EditableIconProps): TypographyLegacy {
  const size: MeasureSpec = {
    value: typeof props.iconSize === "number" ? props.iconSize : 32,
    unit: "px",
    // El texto libre solo se lee con la unidad "custom", y este formato
    // anterior es justo el de no tener ninguna unidad guardada.
    custom: "",
  }
  return {
    size: { desktop: size, tablet: size, mobile: size },
    textColor: props.iconColor || "#111111",
  }
}

/** El fondo de antes, que el icono guardaba como `backgroundColor`. */
export function appearanceLegacyOf(props: EditableIconProps): AppearanceLegacy {
  return { background: props.backgroundColor || "transparent" }
}

export function EditableIcon(props: EditableIconProps) {
  const {
  icon = DEFAULT_ICON_KEY,
  borderRadius = 0,
  href = "",
  openInNewTab = false,
  linkType,
  popupSlug,
  popupAction,
  customClass = "",
  customCss,
  hiddenOnDesktop = false,
  hiddenOnTablet = false,
  hiddenOnMobile = false,
  } = props
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))

  const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })

  const { className: customCssClass, customCssTag } = useCustomCss(customCss)

  // El radio unico de antes, para que se siga pintando hasta que se toque la
  // seccion de bordes y migre.
  const legacy: BorderLegacy = {
    radius: uniformSides(RADIUS_CORNER_KEYS, borderRadius),
    radiusValueFor: () => borderRadius,
  }
  const borde = useBorderCss(props as Record<string, unknown>, legacy)
  const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacy)
  const letra = useTypographyCss(props as Record<string, unknown>, typographyLegacyOf(props))
  const fondo = useAppearance(props, appearanceLegacyOf(props))

  // Se resuelve con el catalogo, que llega aparte (ver lib/icon-loader.ts):
  // `undefined` mientras tanto.
  const SelectedIcon = useIconDefinition(icon)

  const wrapperClass = cn("inline-flex h-fit w-fit", visClass, customCssClass, customClass)

  // De tipo "Popup" no navega aunque conserve un href de antes: abre el popup.
  const popup = popupTargetOf({ linkType, popupSlug, popupAction })

  const iconElement = (
    // "relative isolate" por el fondo de video, que es absolute con -z-10.
    <div
      className={cn(
        "relative isolate inline-flex items-center justify-center",
        borde.className,
        medidas.className,
        fondo.className,
        letra.className,
      )}
    >
      {fondo.backgroundVideo}
      {SelectedIcon ? (
        // El tamaño y el color los pone ahora la seccion Tipografia: el icono
        // mide 1em —y sigue siendo cuadrado, como antes— y hereda `color`,
        // que es con lo que FontAwesome rellena su <path>.
        <FontAwesomeIcon icon={SelectedIcon} style={{ width: "1em", height: "1em" }} />
      ) : SelectedIcon === undefined ? (
        // Mientras llega la definicion se guarda su sitio (1em, como el
        // icono) para que no se mueva lo que hay alrededor al aparecer.
        <span aria-hidden className="inline-block" style={{ width: "1em", height: "1em" }} />
      ) : null}
    </div>
  )

  return (
    <>
    {visibilityJsx}
    {customCssTag}
    {borde.styleTag}
    {medidas.styleTag}
    {letra.styleTag}
    {fondo.styleTag}
    <SelectableNode clickable className={wrapperClass}>
      {popup ? (
        // Un <button> de verdad, sin estilos propios: el teclado y el lector de
        // pantalla lo tratan como tal. En el editor no lleva la accion, asi que
        // el clic solo selecciona.
        <button
          type="button"
          className="m-0 block cursor-pointer border-0 bg-transparent p-0 text-inherit"
          {...(enabled ? {} : popupDataAttributes(popup))}
        >
          {iconElement}
        </button>
      ) : linkType !== "popup" && href ? (
        <a
          href={href}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noreferrer noopener" : undefined}
          onClick={(e) => {
            if (enabled) e.preventDefault()
          }}
        >
          {iconElement}
        </a>
      ) : (
        iconElement
      )}
    </SelectableNode>
    </>
  )
}

EditableIcon.craft = {
  displayName: "Icono",
  props: {
    icon: DEFAULT_ICON_KEY,
    iconSize: 32,
    iconColor: "#111111",
    backgroundColor: "transparent",
    borderRadius: 0,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    href: "",
    openInNewTab: false,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableIconSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
}
