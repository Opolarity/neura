import { useState, useEffect } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { ChevronDown, Plus, Trash2, Copy, GripVertical, Info } from "lucide-react"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss, type BorderLegacy } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, measureFromCss, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
import {
  TypographySection,
  useTypographyCss,
  type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle, MeasureSpec } from "@/modules/ecommerce/editor/components/box-measures"
import type { PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FontFamilySelect } from "@/modules/ecommerce/editor/components/user-components/font-family-select"
import { fontFamilyMap, type FontFamily } from "@/modules/ecommerce/editor/lib/font-families"
import {
  generateId,
  reorderById,
  backfillIdsAndNames,
  needsBackfill,
  nextDefaultName,
  duplicateAt,
  useDragReorder,
} from "./drag-reorder"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"

// ── Types ──────────────────────────────────────────────

interface DropdownItem {
  id?: string
  name?: string
  label: string
  fontSize?: number
  fontFamily?: FontFamily
  linkType?: "none" | "url" | "anchor"
  href?: string
}

interface EditableDropdownButtonProps {
  text?: string
  /** @deprecated Tamano unico de fuente. Lo traen los desplegables ya publicados; hoy se edita por dispositivo. */
  fontSize?: number
  /**
   * @deprecated Grosor guardado como texto ("700"). Se sigue leyendo porque lo
   * traen los desplegables ya publicados; TypographySection lo escribe como
   * numero, que es lo canonico.
   */
  fontWeight?: string
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "default" | "lg"
  iconGap?: number
  widthMobile?: number
  customClass?: string
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string
  /** Color del texto del disparador. Ver TypographySection. */
  textColor?: string
  backgroundColor?: string
  /** Fuente del disparador. Ver TypographySection. */
  fontFamily?: FontFamily
  /**
   * @deprecated Tamano en px desde 768px. Se sigue leyendo porque lo traen los
   * desplegables ya publicados; hoy el tamano va en `sizeDesktop/Tablet/Mobile`
   * con su unidad (ver TypographySection), que reusa este mismo nombre para el
   * escritorio pero acompanado de `sizeUnit`.
   */
  sizeDesktop?: number
  /** @deprecated Tamano en px por debajo de 768px. Mismo motivo que `sizeDesktop`. */
  sizeMobile?: number
  /**
   * @deprecated Alto de linea como numero y unidad sueltos. Se sigue leyendo
   * porque lo traen los desplegables ya publicados; hoy va en
   * `lineHeightDesktop/Tablet/Mobile` + `lineHeightUnit`.
   */
  lineHeightNum?: string
  /** @deprecated La unidad del alto de linea anterior. Mismo motivo que `lineHeightNum`. */
  lineHeightUnit?: string
  /**
   * @deprecated Grosor de borde del formato de un solo valor para todos los
   * tamaños. Hoy hay un juego por modo (ver BorderSection); estos solo se
   * leen mientras el desplegable no tenga ninguna unidad por modo guardada.
   */
  borderLeftWidth?: number
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderRightWidth?: number
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderTopWidth?: number
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderBottomWidth?: number
  borderStyle?: BorderStyle
  borderColor?: string
  /**
   * @deprecated Radio del formato de un solo valor. Mismo motivo que
   * `borderLeftWidth`.
   */
  borderTopLeftRadius?: number
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderTopRightRadius?: number
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderBottomLeftRadius?: number
  /** @deprecated Mismo motivo que `borderLeftWidth`. */
  borderBottomRightRadius?: number
  /**
   * @deprecated El alto como texto CSS. Mismo motivo que `borderLeftWidth`,
   * con el `legacy` de SpacingSection.
   */
  height?: string
  /** @deprecated El relleno sin modo de pantalla. Mismo motivo que `height`. */
  paddingLeft?: number
  /** @deprecated Mismo motivo que `height`. */
  paddingRight?: number
  /** @deprecated Mismo motivo que `height`. */
  paddingTop?: number
  /** @deprecated Mismo motivo que `height`. */
  paddingBottom?: number
  items?: DropdownItem[]
  menuOffset?: number
  hoverToOpen?: boolean
  hiddenOnDesktop?: boolean
  hiddenOnTablet?: boolean
  hiddenOnMobile?: boolean
  [key: string]: unknown
}

// ── Helpers ────────────────────────────────────────────

/**
 * Las medidas del formato anterior: el alto era un texto —"40px"— que valia
 * para los tres modos (vacio, sin alto); el ancho, solo el celular en %; y el
 * relleno, cuatro lados en px sin valor por defecto (lo pone la variante).
 * Lo usan el render y el panel, para que los dos vean lo mismo.
 */
function spacingLegacyOf(props: EditableDropdownButtonProps): SpacingLegacy {
  const { height, widthMobile = 100, paddingTop, paddingRight, paddingBottom, paddingLeft } = props
  return {
    height: {
      desktop: measureFromCss(height || "auto"),
      tablet: measureFromCss(height || "auto"),
      mobile: measureFromCss(height || "auto"),
    },
    width: { mobile: { value: widthMobile, unit: "%", custom: "" } },
    padding: {
      sides: { Top: paddingTop, Right: paddingRight, Bottom: paddingBottom, Left: paddingLeft },
      unit: "px",
      custom: "",
    },
  }
}

/** Las unidades que el control de medidas sabe pintar; el resto va como texto libre. */
const UNIDADES_CONOCIDAS: PropertyUnit[] = ["px", "em", "rem", "%"]

/**
 * El numero y la unidad sueltos del formato anterior, pasados a la medida que
 * entiende TypographySection.
 *
 * Sin unidad —un alto de linea sin unidad es un multiplicador— o con una que el
 * control no lista, la medida va como texto libre, que es lo unico que la pinta
 * tal cual.
 */
function medidaDe(num: unknown, unidad: unknown): MeasureSpec | undefined {
  const texto = String(num ?? "").trim()
  if (!texto) return undefined
  const sufijo = String(unidad ?? "").trim()
  const valor = Number(texto)
  if (sufijo && UNIDADES_CONOCIDAS.includes(sufijo as PropertyUnit) && Number.isFinite(valor))
    return { value: valor, unit: sufijo as PropertyUnit, custom: "" }
  return { value: undefined, unit: "custom", custom: `${texto}${sufijo}` }
}

/**
 * El tamano que el disparador pinta cuando nadie le pone uno: el `text-sm` del
 * boton de shadcn, en px porque la unidad es una sola para los tres modos y
 * mezclarla con la del escritorio la desharia al migrar.
 */
const TAMANO_DEL_BOTON: MeasureSpec = { value: 14, unit: "px", custom: "" }

/**
 * El grosor del formato anterior, que se guardaba como texto ("700", "bold").
 * TypographySection lo escribe como numero, asi que lo que ya esta publicado se
 * traduce al leerlo.
 */
function pesoDe(peso: unknown): number | undefined {
  if (typeof peso === "number") return peso
  const texto = String(peso ?? "").trim()
  if (!texto) return undefined
  if (texto === "bold") return 700
  if (texto === "normal") return 400
  const valor = Number(texto)
  return Number.isFinite(valor) ? valor : undefined
}

/**
 * La letra del formato anterior: la fuente se aplicaba siempre (Inter de base),
 * el tamano iba en px y sin tableta —`sizeDesktop` desde 768px, `sizeMobile`
 * por debajo—, el alto de linea en un numero y una unidad sueltos, y el grosor
 * como texto. Lo usan el render y el panel, para que los dos vean lo mismo.
 *
 * `textColor` no hace falta declararlo: se llama igual y significa lo mismo.
 */
function typographyLegacyOf(props: EditableDropdownButtonProps): TypographyLegacy {
  const { fontSize, sizeDesktop, sizeMobile, lineHeightNum, lineHeightUnit, fontWeight, fontFamily } = props
  // Un 0 guardado no pintaba tamano en el formato anterior —la regla salia solo
  // si el numero era verdadero—, asi que tampoco lo pinta ahora.
  const escritorio = sizeDesktop ?? fontSize
  return {
    fontFamily: fontFamily ?? "sans",
    fontWeight: pesoDe(fontWeight),
    size: {
      ...(escritorio ? { desktop: medidaDe(escritorio, "px") } : {}),
      ...(sizeMobile
        ? { mobile: medidaDe(sizeMobile, "px") }
        : // Con tamano de escritorio y sin tamano de celular, el formato
          // anterior dejaba el celular con el del boton; sin fijarlo aqui la
          // cascada le bajaria el de escritorio y la letra creceria en el
          // telefono de un desplegable ya publicado.
          escritorio
          ? { mobile: TAMANO_DEL_BOTON }
          : {}),
    },
    lineHeight: { desktop: medidaDe(lineHeightNum, lineHeightUnit) },
  }
}

function makeItem(label = "Opción"): DropdownItem {
  return {
    id: generateId(),
    label,
    fontSize: undefined,
    fontFamily: "sans",
    linkType: "none",
    href: "",
  }
}

const defaultItems: DropdownItem[] = [
  makeItem("Opción 1"),
  makeItem("Opción 2"),
]

/**
 * Los bordes del formato anterior (un grosor por lado en px, y el radio solo
 * si el usuario lo definio), con los mismos valores por defecto que aplicaba
 * el componente. Las esquinas sin valor se quedan sin valor: es lo que deja al
 * desplegable conservar el redondeo de su variante de shadcn. Lo usan el
 * render y el panel, para que los dos vean lo mismo.
 */
function borderLegacyOf({
  borderLeftWidth = 0,
  borderRightWidth = 0,
  borderTopWidth = 0,
  borderBottomWidth = 0,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
}: EditableDropdownButtonProps): BorderLegacy {
  return {
    width: {
      sides: {
        Top: borderTopWidth,
        Right: borderRightWidth,
        Bottom: borderBottomWidth,
        Left: borderLeftWidth,
      },
      unit: "px",
      custom: "",
    },
    radius: {
      sides: {
        TopLeft: borderTopLeftRadius,
        TopRight: borderTopRightRadius,
        BottomLeft: borderBottomLeftRadius,
        BottomRight: borderBottomRightRadius,
      },
      unit: "px",
      custom: "",
    },
  }
}

// ── Component ──────────────────────────────────────────

export function EditableDropdownButton(props: EditableDropdownButtonProps) {
  const {
    text = "Botón",
    variant = "default",
    size = "default",
    iconGap = 0,
    customClass = "",
    customCss,
    backgroundColor,
    items = defaultItems,
    menuOffset = 4,
    hoverToOpen = false,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
  } = props

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))

  const { visClass, visibilityJsx } = useVisibilityStyle({
    hiddenOnDesktop,
    hiddenOnTablet,
    hiddenOnMobile,
  })

  const [open, setOpen] = useState(false)

  // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la del
  // componente, para que el usuario pueda pisar sus estilos.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss)

  // Los bordes: grosor, estilo, color y radio, por modo de pantalla. Van en el
  // boton, que es lo que se ve; mientras el bloque siga en el formato anterior
  // se pintan los de entonces.
  const borde = useBorderCss(props as Record<string, unknown>, borderLegacyOf(props))
  // Ancho, alto, relleno y margen por modo, tambien en el boton. Mientras el
  // bloque siga en el formato anterior se pintan las medidas de entonces.
  const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))
  // La letra del disparador: fuente, grosor, tamano, alto de linea, espaciado y
  // color, por modo de pantalla. Mientras el bloque siga en el formato anterior
  // se pinta la letra de entonces.
  const letra = useTypographyCss(props as Record<string, unknown>, typographyLegacyOf(props))

  return (
    <>
      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {letra.styleTag}
      <SelectableNode
        // El onClick que hacia selectNode ya no hace falta: el wrapper conecta
        // el nodo con craft y la seleccion sale de ahi.
        // El wrapper no registra estos handlers en edicion, asi que aqui ya no
        // hace falta comprobar el modo.
        onMouseEnter={() => { if (hoverToOpen) setOpen(true) }}
        onMouseLeave={() => { if (hoverToOpen) setOpen(false) }}
        className={`relative h-fit w-fit group ${customCssClass} ${customClass} ${visClass}`}
      >
        <Popover open={enabled ? false : open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={`btn-inner flex items-center ${borde.className} ${medidas.className} ${letra.className}`}
              style={{ backgroundColor, gap: iconGap }}
            >
              {text}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={menuOffset}
            alignOffset={0}
            className="w-auto min-w-[8rem] p-1"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {items.map((item) => {
              const itemStyle: React.CSSProperties = {
                fontFamily: item.fontFamily ? fontFamilyMap[item.fontFamily] : undefined,
                fontSize: item.fontSize ? `${item.fontSize}px` : undefined,
              }
              const hasLink = (item.linkType === "url" || item.linkType === "anchor") && item.href
              const sharedClass = "flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              return hasLink ? (
                <a
                  key={item.id}
                  href={item.href}
                  className={sharedClass}
                  style={itemStyle}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <div
                  key={item.id}
                  className={sharedClass}
                  style={itemStyle}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </div>
              )
            })}
          </PopoverContent>
        </Popover>
      </SelectableNode>
    </>
  )
}

// ── Settings ───────────────────────────────────────────

function EditableDropdownButtonSettings() {
  const {
    actions: { setProp },
    text,
    variant,
    size,
    iconGap,
    customClass,
    customCss,
    backgroundColor,
    borderLegacy,
    spacingLegacy,
    typographyLegacy,
    items,
    menuOffset,
    hoverToOpen,
  } = useNode((node) => ({
    text: node.data.props.text as string,
    variant: node.data.props.variant as EditableDropdownButtonProps["variant"],
    size: node.data.props.size as EditableDropdownButtonProps["size"],
    iconGap: node.data.props.iconGap as number,
    customClass: node.data.props.customClass as string,
    customCss: node.data.props.customCss as string | undefined,
    backgroundColor: node.data.props.backgroundColor as string | undefined,
    // Los bordes del formato anterior, resueltos igual que en el render.
    borderLegacy: borderLegacyOf(node.data.props as EditableDropdownButtonProps),
    // Las medidas del formato anterior, resueltas igual que en el render.
    spacingLegacy: spacingLegacyOf(node.data.props as EditableDropdownButtonProps),
    // La letra del formato anterior, resuelta igual que en el render.
    typographyLegacy: typographyLegacyOf(node.data.props as EditableDropdownButtonProps),
    items: node.data.props.items as DropdownItem[],
    menuOffset: node.data.props.menuOffset as number,
    hoverToOpen: node.data.props.hoverToOpen as boolean,
  }))

  // Que items estan desplegados, para tintar solo esas cabeceras.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  // Opciones guardadas antes de este cambio pueden no tener id/nombre.
  useEffect(() => {
    if (needsBackfill(items)) {
      setProp((props: Required<EditableDropdownButtonProps>) => {
        props.items = backfillIdsAndNames(props.items, "Opción")
      })
    }
  }, [items, setProp])

  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
    useDragReorder((fromId, toId) => {
      setProp((props: Required<EditableDropdownButtonProps>) => {
        props.items = reorderById(props.items, fromId, toId)
      })
    })

  const updateItem = (
    index: number,
    field: keyof DropdownItem,
    value: string | number | undefined
  ) => {
    setProp((props: Required<EditableDropdownButtonProps>) => {
      const newItems = [...props.items]
      newItems[index] = { ...newItems[index], [field]: value }
      props.items = newItems
    })
  }

  const addItem = () => {
    setProp((props: Required<EditableDropdownButtonProps>) => {
      props.items = [
        ...props.items,
        {
          ...makeItem(`Opción ${props.items.length + 1}`),
          name: nextDefaultName(props.items, "Opción"),
        },
      ]
    })
  }

  const duplicateItem = (index: number) => {
    setProp((props: Required<EditableDropdownButtonProps>) => {
      props.items = duplicateAt(props.items, index, "Opción")
    })
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setProp((props: Required<EditableDropdownButtonProps>) => {
      props.items = props.items.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Texto</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              value={text}
              onChange={(e) =>
                setProp((props: EditableDropdownButtonProps) => (props.text = e.target.value))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Comportamiento">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="hoverToOpen" className="text-[11px] text-foreground/80 cursor-pointer">
              Abrir con hover
            </Label>
            <Checkbox
              id="hoverToOpen"
              checked={hoverToOpen ?? false}
              onCheckedChange={(checked) =>
                setProp(
                  (props: EditableDropdownButtonProps) => (props.hoverToOpen = checked === true)
                )
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Espaciado del Menú (px)</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              type="number"
              value={menuOffset ?? 4}
              onChange={(e) =>
                setProp(
                  (props: EditableDropdownButtonProps) =>
                    (props.menuOffset = parseInt(e.target.value) || 0)
                )
              }
            />
          </div>
        </div>
      </SettingsSection>

      {/* La alineacion no se ofrece: el disparador es un flex con su contenido
          centrado, asi que alinear el texto dentro no mueve nada. */}
      <TypographySection legacy={typographyLegacy} fields={{ textAlign: false }} />

      <SettingsSection title="Apariencia">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Variante</Label>
            <Select
              value={variant}
              onValueChange={(val) =>
                setProp(
                  (props: EditableDropdownButtonProps) => (props.variant = val as any)
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="default">Default</SelectItem>
                <SelectItem className="text-[12px]" value="secondary">Secondary</SelectItem>
                <SelectItem className="text-[12px]" value="outline">Outline</SelectItem>
                <SelectItem className="text-[12px]" value="ghost">Ghost</SelectItem>
                <SelectItem className="text-[12px]" value="destructive">Destructive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Tamaño</Label>
            <Select
              value={size}
              onValueChange={(val) =>
                setProp(
                  (props: EditableDropdownButtonProps) => (props.size = val as any)
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-[12px]" value="sm">Small</SelectItem>
                <SelectItem className="text-[12px]" value="default">Medium</SelectItem>
                <SelectItem className="text-[12px]" value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Espaciado del ícono (px)</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              type="number"
              min={0}
              value={iconGap ?? 0}
              onChange={(e) =>
                setProp(
                  (props: EditableDropdownButtonProps) =>
                    (props.iconGap = parseInt(e.target.value) || 0)
                )
              }
            />
          </div>

          {/* El color de texto vive en Tipografía, con el resto de la letra. */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Color de fondo</Label>
            <div className="[&_button]:h-8 [&_button]:text-[12px]">
              <ColorField
                value={backgroundColor}
                onChange={(val) =>
                  setProp((props: EditableDropdownButtonProps) => (props.backgroundColor = val))
                }
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <SpacingSection legacy={spacingLegacy} />

      <BorderSection legacy={borderLegacy} />

      <SettingsSection title="Opciones">
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const itemKey = item.id ?? String(index)
            const isOpen = !!openItems[itemKey]
            const displayName = item.name?.trim() || `Opción ${index + 1}`

            return (
            <Collapsible
              key={itemKey}
              open={isOpen}
              onOpenChange={(value) =>
                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
              }
            >
              <div
                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(item.id)}`}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
              >
                <CollapsibleTrigger asChild>
                  {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                      ocupan el alto completo de la fila y no quedan huecos
                      muertos que desplieguen el item por un click fallido.
                      La cabecera solo se tinta cuando el item esta desplegado. */}
                  <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                    <div className="flex items-stretch min-w-0 flex-1">
                      <span
                        draggable={!!item.id}
                        onDragStart={(e) => {
                          e.stopPropagation()
                          if (item.id) handleDragStart(e, item.id)
                        }}
                        onDragEnd={handleDragEnd}
                        className="flex shrink-0 items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-3 w-3" />
                      </span>
                      {/* El truncate va en el hijo: sobre un contenedor flex el
                          ellipsis no se aplica. title = tooltip nativo. */}
                      <span className="flex items-center min-w-0 py-2.5 pr-2.5">
                        <span
                          className="truncate text-[12px] font-medium"
                          title={displayName}
                        >
                          {displayName}
                        </span>
                      </span>
                    </div>

                    {/* Botones pegados entre si: sus areas se tocan, pero el
                        px-2.5 de cada uno mantiene separados los iconos. */}
                    <div className="flex items-stretch shrink-0">
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateItem(index)
                        }}
                        title="Duplicar"
                        className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          removeItem(index)
                        }}
                        title="Eliminar"
                        className="flex items-center px-2.5 py-2.5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-3 px-3 [&>*:first-child]:pt-3 [&>*:last-child]:pb-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-[11px] font-bold text-foreground/80">Nombre</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Para qué sirve el nombre"
                            className="text-muted-foreground hover:text-foreground cursor-help"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-[12px]">
                          Solo se utiliza para identificar la opción dentro del editor.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      value={item.name ?? ""}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Texto</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={item.label}
                      onChange={(e) => updateItem(index, "label", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Tamaño de fuente (px)</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      type="number"
                      value={item.fontSize ?? ""}
                      min={10}
                      max={96}
                      placeholder="Auto"
                      onChange={(e) =>
                        updateItem(
                          index,
                          "fontSize",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Fuente</Label>
                    <FontFamilySelect
                      value={item.fontFamily ?? "sans"}
                      onChange={(val) => updateItem(index, "fontFamily", val)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Tipo de enlace</Label>
                    <Select
                      value={item.linkType ?? "none"}
                      onValueChange={(val) =>
                        updateItem(index, "linkType", val as "none" | "url" | "anchor")
                      }
                    >
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="text-[12px]" value="none">Ninguno</SelectItem>
                        <SelectItem className="text-[12px]" value="url">Link (URL)</SelectItem>
                        <SelectItem className="text-[12px]" value="anchor">Ancla (#id)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(item.linkType === "url" || item.linkType === "anchor") && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">
                        {item.linkType === "anchor" ? "ID del ancla (ej: #seccion)" : "URL"}
                      </Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        value={item.href ?? ""}
                        placeholder={item.linkType === "anchor" ? "#mi-seccion" : "https://..."}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\s/g, "")
                          if (item.linkType === "anchor" && val && !val.startsWith("#")) {
                            val = "#" + val
                          }
                          updateItem(index, "href", val)
                        }}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
            )
          })}

          <Button variant="outline" size="sm" onClick={addItem} className="w-full h-8 text-[12px]">
            <Plus className="h-3 w-3 mr-2" />
            Agregar opción
          </Button>
        </div>
      </SettingsSection>

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableDropdownButtonProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableDropdownButtonProps) => (props.customCss = val))
        }
      />
    </div>
  )
}

// ── CraftJS Config ─────────────────────────────────────

EditableDropdownButton.craft = {
  displayName: "Desplegable (clic)",
  props: {
    text: "Botón",
    variant: "default" as const,
    size: "default" as const,
    iconGap: 0,
    widthMobile: 100,
    customClass: "",
    textColor: undefined,
    backgroundColor: undefined,
    fontFamily: "sans" as const,
    sizeDesktop: undefined,
    sizeMobile: undefined,
    lineHeightNum: "",
    lineHeightUnit: "",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    // Radios y relleno quedan fuera a proposito: craft.js arma las props como
    // { ...craft.props, ...guardadas }, asi que declararlos aqui se los
    // inyectaria a los desplegables ya publicados.
    height: "",
    items: defaultItems,
    menuOffset: 4,
    hoverToOpen: false,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableDropdownButtonSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
}
