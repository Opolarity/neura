// El panel del Icono, con el buscador de FontAwesome.
//
// Vive aparte de editable-icon.tsx porque el buscador necesita el catalogo
// entero (~515 KB gz, lib/icon-catalog.ts) y el lienzo no: EditableIcon.craft
// lo carga con React.lazy la primera vez que se selecciona un Icono.

import { useMemo, useState } from "react"
import { useNode } from "@craftjs/core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ChevronDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/shared/utils/utils"
import {
  ALL_OPTIONS,
  BRAND_OPTIONS,
  ICON_BY_KEY,
  SOLID_OPTIONS,
  normalizeIconKey,
  type IconSet,
} from "@/modules/ecommerce/editor/lib/icon-catalog"
import { primeIcon } from "@/modules/ecommerce/editor/lib/icon-loader"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection } from "@/modules/ecommerce/editor/components/advanced-section"
import { LinkSection } from "@/modules/ecommerce/editor/components/link-section"
import { TypographySection, useTypographyCss } from "@/modules/ecommerce/editor/components/typography-section"
import { AppearanceSection, useAppearance } from "@/modules/ecommerce/editor/components/appearance-section"
import {
  BorderSection,
  useBorderCss,
  uniformSides,
  type BorderLegacy,
} from "@/modules/ecommerce/editor/components/border-section"
import { RADIUS_CORNER_KEYS } from "@/modules/ecommerce/editor/components/box-measures"
import { SpacingSection } from "@/modules/ecommerce/editor/components/spacing-section"
import {
  appearanceLegacyOf,
  spacingLegacy,
  typographyLegacyOf,
  type EditableIconProps,
} from "./editable-icon"

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
                    // El lienzo ya tiene la definicion: no espera a resolverla.
                    primeIcon(option.key, option.icon)
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

export function EditableIconSettings() {
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
