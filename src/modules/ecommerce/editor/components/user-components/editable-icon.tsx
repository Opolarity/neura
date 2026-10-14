import { useMemo, useState } from "react"
import { useNode, useEditor } from "@craftjs/core"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as solidIcons from "@fortawesome/free-solid-svg-icons"
import * as brandIcons from "@fortawesome/free-brands-svg-icons"
import { ChevronDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import {
  LinkSection,
  popupDataAttributes,
  popupTargetOf,
  type PopupLinkAction,
} from "@/modules/ecommerce/editor/components/link-section"
import {
  TypographySection,
  useTypographyCss,
  type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import {
  AppearanceSection,
  useAppearance,
  type AppearanceLegacy,
} from "@/modules/ecommerce/editor/components/appearance-section"
import {
  BorderSection,
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
  SpacingSection,
  useSpacingCss,
  uniformSpacing,
  type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"

type IconSet = "brands" | "solid" | "all"

type IconOption = {
  key: string
  label: string
  icon: IconDefinition
  set: Exclude<IconSet, "all">
}

const LEGACY_ICON_MAP: Record<string, string> = {
  Star: "fas:star",
  star: "fas:star",
  Heart: "fas:heart",
  heart: "fas:heart",
  ShoppingCart: "fas:cart-shopping",
  shoppingCart: "fas:cart-shopping",
  Search: "fas:magnifying-glass",
  search: "fas:magnifying-glass",
  Home: "fas:house",
  home: "fas:house",
  User: "fas:user",
  user: "fas:user",
  Users: "fas:users",
  users: "fas:users",
  Phone: "fas:phone",
  phone: "fas:phone",
  Mail: "fas:envelope",
  mail: "fas:envelope",
  MapPin: "fas:map-pin",
  mapPin: "fas:map-pin",
  Settings: "fas:gear",
  settings: "fas:gear",
  Check: "fas:check",
  check: "fas:check",
  X: "fas:xmark",
  x: "fas:xmark",
  Plus: "fas:plus",
  plus: "fas:plus",
  Info: "fas:circle-info",
  info: "fas:circle-info",
  Link: "fas:link",
  link: "fas:link",
  ExternalLink: "fas:arrow-up-right-from-square",
  externalLink: "fas:arrow-up-right-from-square",
  Tag: "fas:tag",
  tag: "fas:tag",
  Gift: "fas:gift",
  gift: "fas:gift",
  Truck: "fas:truck",
  truck: "fas:truck",
  Facebook: "fab:facebook",
  facebook: "fab:facebook",
  Instagram: "fab:instagram",
  instagram: "fab:instagram",
  Twitter: "fab:twitter",
  twitter: "fab:twitter",
  Linkedin: "fab:linkedin",
  linkedin: "fab:linkedin",
  Github: "fab:github",
  github: "fab:github",
  Youtube: "fab:youtube",
  youtube: "fab:youtube",
}

function isIconDefinition(value: unknown): value is IconDefinition {
  return Boolean(
    value &&
      typeof value === "object" &&
      "iconName" in value &&
      "prefix" in value
  )
}

function formatIconLabel(name: string): string {
  return name
    .replace(/-/g, " ")
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
}

function buildIconOptions(
  list: IconDefinition[],
  set: Exclude<IconSet, "all">
): IconOption[] {
  const seen = new Set<string>()
  const result: IconOption[] = []
  list.forEach((icon) => {
    const key = `${icon.prefix}:${icon.iconName}`
    if (seen.has(key)) return
    seen.add(key)
    result.push({
      key,
      label: formatIconLabel(icon.iconName),
      icon,
      set,
    })
  })
  return result
}

const BRAND_ICON_DEFS = Object.values(brandIcons).filter(isIconDefinition)
const SOLID_ICON_DEFS = Object.values(solidIcons).filter(isIconDefinition)

const BRAND_OPTIONS = buildIconOptions(BRAND_ICON_DEFS, "brands")
const SOLID_OPTIONS = buildIconOptions(SOLID_ICON_DEFS, "solid")
const ALL_OPTIONS = [...BRAND_OPTIONS, ...SOLID_OPTIONS].sort((a, b) =>
  a.label.localeCompare(b.label)
)

const ICON_BY_KEY = new Map(ALL_OPTIONS.map((option) => [option.key, option]))
const DEFAULT_ICON_KEY = ICON_BY_KEY.has("fas:star")
  ? "fas:star"
  : ALL_OPTIONS[0]?.key ?? ""

function normalizeIconKey(raw?: string): string {
  if (!raw) return DEFAULT_ICON_KEY
  if (ICON_BY_KEY.has(raw)) return raw

  const mapped = LEGACY_ICON_MAP[raw]
  if (mapped && ICON_BY_KEY.has(mapped)) return mapped

  const normalized = raw.toLowerCase().replace(/\s+/g, "-")
  const direct = ALL_OPTIONS.find((option) => option.icon.iconName === normalized)
  if (direct) return direct.key

  return DEFAULT_ICON_KEY
}
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
// AQUI
interface EditableIconProps {
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
const spacingLegacy: SpacingLegacy = {
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
function typographyLegacyOf(props: EditableIconProps): TypographyLegacy {
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
function appearanceLegacyOf(props: EditableIconProps): AppearanceLegacy {
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

  const resolvedKey = normalizeIconKey(icon)
  const SelectedIcon = ICON_BY_KEY.get(resolvedKey)?.icon

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

function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [search, setSearch] = useState("")
  const initialSet = ICON_BY_KEY.get(normalizeIconKey(value))?.set ?? "brands"
  const [iconSet, setIconSet] = useState<IconSet>(initialSet)

  const options = useMemo(() => {
    const source =
      iconSet === "brands" ? BRAND_OPTIONS : iconSet === "solid" ? SOLID_OPTIONS : ALL_OPTIONS
    const term = search.trim().toLowerCase()
    if (!term) return source
    return source.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.icon.iconName.toLowerCase().includes(term)
    )
  }, [iconSet, search])

  const selectedKey = normalizeIconKey(value)
  const selectedOption = ICON_BY_KEY.get(selectedKey)

  const setLabel =
    iconSet === "brands" ? "Brands" : iconSet === "solid" ? "Solid" : "Todos"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2 text-[12px] text-foreground"
        >
          <span className="truncate">Fontawesome - {setLabel}</span>
          <span className="flex items-center gap-2">
            {selectedOption ? (
              <FontAwesomeIcon
                icon={selectedOption.icon}
                style={{ width: 16, height: 16 }}
              />
            ) : null}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] border-border bg-popover p-3 text-popover-foreground">
        <div className="flex items-center justify-between rounded-md bg-muted px-2.5 py-1.5 text-[11px] font-semibold">
          <span>Fontawesome - {setLabel}</span>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted/80"
            onClick={() => setSearch("")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex gap-2 text-[11px]">
          {[
            { value: "brands", label: "Brands" },
            { value: "solid", label: "Solid" },
            { value: "all", label: "Todos" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setIconSet(item.value as IconSet)}
              className={cn(
                "rounded-full px-2.5 py-0.5 transition",
                iconSet === item.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Input
          value={search}
          placeholder="Buscar ícono..."
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 h-7 text-[11px]"
        />

        <ScrollArea className="mt-2 h-56" thumbClassName="bg-primary">
          <div className="grid grid-cols-4 gap-2 pr-2">
            {options.map((option) => {
              const isSelected = option.key === selectedKey
              return (
                <button
                  key={option.key}
                  type="button"
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background text-foreground transition",
                    "hover:bg-muted",
                    isSelected ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => {
                    onChange(option.key)
                    if (iconSet !== "all") setIconSet(option.set)
                  }}
                >
                  <FontAwesomeIcon
                    icon={option.icon}
                    style={{ width: 18, height: 18 }}
                  />
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function EditableIconSettings() {
  // El panel lee el nodo entero: las secciones comunes resuelven desde ahi lo
  // que el Preview tiene que enseñar.
  const {
    actions: { setProp },
    bag,
  } = useNode((node) => ({ bag: node.data.props as EditableIconProps }));
  const { icon, borderRadius, customClass, customCss } = bag

  const safeIconKey = normalizeIconKey(icon)
  const safeBorderRadius = typeof borderRadius === "number" ? borderRadius : 0
  const legacy: BorderLegacy = {
    radius: uniformSides(RADIUS_CORNER_KEYS, safeBorderRadius),
    radiusValueFor: () => safeBorderRadius,
  }

  // El Preview pinta con las reglas ya resueltas, no con las props sueltas:
  // asi el radio, el borde, el fondo, el tamaño y el color que enseña son los
  // que de verdad se van a ver, y siguen al modo de pantalla que se este
  // mirando. Antes leia `borderRadius` —la prop anterior—, con lo que tocar
  // el radio en Bordes no cambiaba nada aqui.
  const bordePreview = useBorderCss(bag as Record<string, unknown>, legacy)
  const letraPreview = useTypographyCss(bag as Record<string, unknown>, typographyLegacyOf(bag))
  const fondoPreview = useAppearance(bag, appearanceLegacyOf(bag))

  const previewIcon = ICON_BY_KEY.get(safeIconKey)?.icon

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Preview</Label>
            {bordePreview.styleTag}
            {letraPreview.styleTag}
            {fondoPreview.styleTag}
            {/* El marco es del panel —delimita la caja aunque el icono no
                lleve borde ni fondo—; dentro va el icono con lo suyo. */}
            <div className="inline-flex items-center justify-center rounded border border-border p-2">
              <div
                className={cn(
                  "relative isolate inline-flex items-center justify-center",
                  bordePreview.className,
                  fondoPreview.className,
                  letraPreview.className,
                )}
              >
                {fondoPreview.backgroundVideo}
                {previewIcon ? (
                  <FontAwesomeIcon icon={previewIcon} style={{ width: "1em", height: "1em" }} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Icono</Label>
            <IconPicker
              value={safeIconKey}
              onChange={(val) => setProp((props: EditableIconProps) => (props.icon = val))}
            />
          </div>
        </div>
      </SettingsSection>

      <TypographySection
        legacy={typographyLegacyOf(bag)}
        // Un icono de FontAwesome es un SVG, no letra: no tiene familia ni
        // grosor, y no hay lineas que separar ni letras que espaciar. La
        // alineacion se cae por lo mismo que en el Boton: aqui alinear seria
        // el `justify-content` de su caja, que es disposicion y no letra.
        fields={{
          fontFamily: false,
          fontWeight: false,
          lineHeight: false,
          letterSpacing: false,
          textAlign: false,
        }}
      />

      <AppearanceSection legacy={appearanceLegacyOf(bag)} />

      <LinkSection
        help="Con un enlace, el icono lleva a esa dirección."
        helpLabel="Qué hace el enlace del icono"
        linkTypes={["url", "popup"]}
      />

      <SpacingSection legacy={spacingLegacy} />

      <BorderSection legacy={legacy} />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableIconProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableIconProps) => (props.customCss = val))
        }
      />
    </div>
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
