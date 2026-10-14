import { useId, useState, useEffect } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context"
import Autoplay from "embla-carousel-autoplay"
import { Plus, Trash2, Copy, GripVertical, Info } from "lucide-react"
import {
  generateId,
  reorderById,
  backfillIdsAndNames,
  needsBackfill,
  nextDefaultName,
  duplicateAt,
  useDragReorder,
} from "./drag-reorder"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useEditorCarouselReset } from "@/modules/ecommerce/editor/hooks/use-editor-carousel-reset"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss } from "@/modules/ecommerce/editor/components/spacing-section"
import { TypographySection, useTypographyCss } from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ── Types ──────────────────────────────────────────────

interface CardSlide {
  id?: string
  // Nombre fijo de la card en el panel ("Card N"): se genera al crearla y
  // viaja con ella al reordenar, sin depender del titulo.
  name?: string
  backgroundImage: string
  title: string
  titleFontSize: number
  titleColor: string
  description: string
  descriptionFontSize: number
  descriptionColor: string
  contentPosition: "flex-start" | "center" | "flex-end"
  textAlign: "left" | "center" | "right"
  boxBackgroundColor: string
  boxPadding: string
  boxBorderRadius: number
  overlayColor: string
  height: string
  borderRadius: number
  hoverBoxBackgroundColor: string
  hoverTitleColor: string
  hoverDescriptionColor: string
  hoverOverlayColor: string
  href?: string
}

interface EditableCardCarouselProps {
  cards?: CardSlide[]
  slidesDesktop?: number
  slidesTablet?: number
  slidesMobile?: number
  gap?: number
  autoPlayInterval?: number
  loop?: boolean
  borderStyle?: BorderStyle
  borderColor?: string
  customClass?: string
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string
  hiddenOnDesktop?: boolean
  hiddenOnTablet?: boolean
  hiddenOnMobile?: boolean
  [key: string]: unknown
}

const defaultCard: CardSlide = {
  backgroundImage: "/images/hero-banner.jpg",
  title: "Titulo de la Card",
  titleFontSize: 24,
  titleColor: "#ffffff",
  description: "Descripcion de la card con informacion relevante.",
  descriptionFontSize: 14,
  descriptionColor: "rgba(255, 255, 255, 0.8)",
  contentPosition: "flex-end",
  textAlign: "left",
  boxBackgroundColor: "rgba(0, 0, 0, 0.3)",
  boxPadding: "20px",
  boxBorderRadius: 5,
  overlayColor: "rgba(0,0,0,0.4)",
  height: "350px",
  borderRadius: 12,
  hoverBoxBackgroundColor: "rgba(0, 0, 0, 0.5)",
  hoverTitleColor: "#ffffff",
  hoverDescriptionColor: "#ffffff",
  hoverOverlayColor: "rgba(0,0,0,0.6)",
  href: "",
}

function makeCard(title: string = defaultCard.title): CardSlide {
  return { ...defaultCard, id: generateId(), title }
}

const defaultCards: CardSlide[] = [
  makeCard(),
  makeCard("Segunda Card"),
  makeCard("Tercera Card"),
]

// ── Component ──────────────────────────────────────────

export function EditableCardCarousel(props: EditableCardCarouselProps) {
  const {
  cards = defaultCards,
  slidesDesktop = 3,
  slidesTablet = 2,
  slidesMobile = 1,
  gap = 16,
  autoPlayInterval = 0,
  loop = true,
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
  const slidesActive = useResponsiveValue({ desktop: slidesDesktop, tablet: slidesTablet, mobile: slidesMobile })

  const id = useId()
  const carouselClass = `card-carousel-${id.replace(/:/g, "")}`

  // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la del
  // carrusel, para que el usuario pueda pisarla si quiere.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss)

  // El borde del carrusel entero, de la seccion "Bordes" del panel.
  const borde = useBorderCss(props as Record<string, unknown>)
  // Las medidas del carrusel entero, de "Tamaño y espaciado". Nunca tuvo
  // relleno ni alto propios, asi que no hay legado que reproducir.
  const medidas = useSpacingCss(props as Record<string, unknown>)

  // La letra del bloque, de la seccion "Tipografía". Va en el contenedor del
  // que cuelgan las tarjetas, no en cada tarjeta: es la base que heredan las
  // que no traigan lo suyo. No lleva legado porque el bloque nunca guardo
  // tipografia propia; `titleFontSize`/`titleColor`/`textAlign` son de cada
  // slide, no del bloque, y declararlos aqui cambiaria las tarjetas ya
  // publicadas. Cada slide sigue ganando: pinta su tamaño y su alineacion en
  // el `style` en linea, y sus colores con un selector mas especifico.
  const letra = useTypographyCss(props as Record<string, unknown>)

  // Se expone la api de embla solo para poder rebobinar el carrusel al entrar
  // en modo edicion.
  const [api, setApi] = useState<CarouselApi>()
  useEditorCarouselReset(api)

  const plugins = autoPlayInterval > 0 && !enabled
    ? [Autoplay({ delay: autoPlayInterval, stopOnInteraction: true })]
    : []

  return (
    <>
      <style>{`
        ${slidesActive !== null ? `
        .${carouselClass} .embla-item {
          flex: 0 0 calc(${100 / slidesActive}% - ${gap * (slidesActive - 1) / slidesActive}px);
          min-width: 0;
        }` : `
        .${carouselClass} .embla-item {
          flex: 0 0 calc(${100 / slidesMobile}% - ${gap * (slidesMobile - 1) / slidesMobile}px);
          min-width: 0;
        }
        @media (min-width: 768px) {
          .${carouselClass} .embla-item {
            flex: 0 0 calc(${100 / slidesTablet}% - ${gap * (slidesTablet - 1) / slidesTablet}px);
          }
        }
        @media (min-width: 1024px) {
          .${carouselClass} .embla-item {
            flex: 0 0 calc(${100 / slidesDesktop}% - ${gap * (slidesDesktop - 1) / slidesDesktop}px);
          }
        }`}
        ${cards.map((card, i) => {
          const cls = `${carouselClass}-card-${i}`
          return `
            .${cls} .card-overlay {
              background-color: ${card.overlayColor};
              transition: background-color 0.3s ease;
            }
            .${cls}:hover .card-overlay {
              background-color: ${card.hoverOverlayColor};
            }
            .${cls} .card-title {
              color: ${card.titleColor};
              transition: color 0.3s ease;
            }
            .${cls}:hover .card-title {
              color: ${card.hoverTitleColor};
            }
            .${cls} .card-description {
              color: ${card.descriptionColor};
              transition: color 0.3s ease;
            }
            .${cls}:hover .card-description {
              color: ${card.hoverDescriptionColor};
            }
            .${cls}:hover .box-content {
              background-color: ${card.hoverBoxBackgroundColor};
            }
          `
        }).join("")}
      `}</style>

      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {letra.styleTag}
      <SelectableNode
        className={`${carouselClass} ${borde.className} ${medidas.className} ${letra.className} w-full ${visClass} ${customCssClass} ${customClass}`}
      >
        <Carousel
          setApi={setApi}
          opts={{ loop, align: "start" }}
          plugins={plugins}
          className="w-full"
        >
          <CarouselContent style={{ gap }}>
            {cards.map((card, i) => (
              <CarouselItem
                key={card.id ?? i}
                className={`embla-item !p-0`}
              >
                <div
                  className={`${carouselClass}-card-${i} relative overflow-hidden`}
                  style={{
                    height: card.height,
                    borderRadius: card.borderRadius,
                    cursor: !enabled && card.href ? "pointer" : undefined,
                  }}
                  onClick={() => { if (!enabled && card.href) window.location.href = card.href }}
                >
                  <img
                    src={card.backgroundImage}
                    alt={card.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      inset: 0,
                    }}
                  />
                  <div className="card-overlay absolute inset-0" />
                  <div
                    className="relative h-full flex flex-col px-6 py-5"
                    style={{
                      justifyContent: card.contentPosition,
                      textAlign: card.textAlign,
                    }}
                  >
                    <div
                      className="relative box-content"
                      style={{
                        backgroundColor: card.boxBackgroundColor,
                        padding: card.boxPadding,
                        borderRadius: card.boxBorderRadius,
                      }}
                    >
                      {card.title && (
                        <h3
                          className="card-title font-bold leading-tight"
                          style={{ fontSize: card.titleFontSize }}
                        >
                          {card.title}
                        </h3>
                      )}
                      {card.description && (
                        <p
                          className="card-description mt-2 leading-snug"
                          style={{ fontSize: card.descriptionFontSize }}
                        >
                          {card.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 bg-black/30 hover:bg-black/50 border-0 text-white" />
          <CarouselNext className="right-2 bg-black/30 hover:bg-black/50 border-0 text-white" />
        </Carousel>
      </SelectableNode>
    </>
  )
}

// ── Settings ───────────────────────────────────────────

const slidesOptions = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
]

function EditableCardCarouselSettings() {
  const {
    actions: { setProp },
    cards,
    slidesDesktop,
    slidesTablet,
    slidesMobile,
    gap,
    autoPlayInterval,
    loop,
    customClass,
    customCss,
  } = useNode((node) => ({
    cards: node.data.props.cards as CardSlide[],
    slidesDesktop: node.data.props.slidesDesktop as number,
    slidesTablet: node.data.props.slidesTablet as number,
    slidesMobile: node.data.props.slidesMobile as number,
    gap: node.data.props.gap as number,
    autoPlayInterval: node.data.props.autoPlayInterval as number,
    loop: node.data.props.loop as boolean,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
  }))

  // Que items estan desplegados, para tintar solo esas cabeceras.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  // Cards guardadas antes de este cambio pueden no tener id/nombre.
  useEffect(() => {
    if (needsBackfill(cards)) {
      setProp((props: Required<EditableCardCarouselProps>) => {
        props.cards = backfillIdsAndNames(props.cards, "Tarjeta")
      })
    }
  }, [cards, setProp])

  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
    useDragReorder((fromId, toId) => {
      setProp((props: Required<EditableCardCarouselProps>) => {
        props.cards = reorderById(props.cards, fromId, toId)
      })
    })

  const updateCard = (
    index: number,
    field: keyof CardSlide,
    value: string | number
  ) => {
    setProp((props: Required<EditableCardCarouselProps>) => {
      const newCards = [...props.cards]
      newCards[index] = { ...newCards[index], [field]: value }
      props.cards = newCards
    })
  }

  const addCard = () => {
    setProp((props: Required<EditableCardCarouselProps>) => {
      props.cards = [
        ...props.cards,
        {
          ...defaultCard,
          id: generateId(),
          name: nextDefaultName(props.cards, "Tarjeta"),
        },
      ]
    })
  }

  const duplicateCard = (index: number) => {
    setProp((props: Required<EditableCardCarouselProps>) => {
      props.cards = duplicateAt(props.cards, index, "Tarjeta")
    })
  }

  const removeCard = (index: number) => {
    if (cards.length <= 1) return
    setProp((props: Required<EditableCardCarouselProps>) => {
      props.cards = props.cards.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          {cards.map((card, index) => {
            const itemKey = card.id ?? String(index)
            const isOpen = !!openItems[itemKey]
            const displayName = card.name?.trim() || `Tarjeta ${index + 1}`

            return (
            <Collapsible
              key={itemKey}
              open={isOpen}
              onOpenChange={(value) =>
                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
              }
            >
              <div
                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(card.id)}`}
                onDragOver={(e) => handleDragOver(e, card.id)}
                onDrop={(e) => handleDrop(e, card.id)}
              >
                <CollapsibleTrigger asChild>
                  {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                      ocupan el alto completo de la fila y no quedan huecos
                      muertos que desplieguen el item por un click fallido.
                      La cabecera solo se tinta cuando el item esta desplegado. */}
                  <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                    <div className="flex items-stretch min-w-0 flex-1">
                      <span
                        draggable={!!card.id}
                        onDragStart={(e) => {
                          e.stopPropagation()
                          if (card.id) handleDragStart(e, card.id)
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
                          duplicateCard(index)
                        }}
                        title="Duplicar"
                        className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </div>

                      {cards.length > 1 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCard(index)
                          }}
                          title="Eliminar"
                          className="flex items-center px-2.5 py-2.5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-3 px-3 [&>*:first-child]:pt-3 [&>*:last-child]:pb-3">
                  {/* Content */}
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
                          Solo se utiliza para identificar la tarjeta dentro del editor.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={card.name ?? ""}
                      onChange={(e) => updateCard(index, "name", e.target.value)}
                      placeholder={`Tarjeta ${index + 1}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Imagen de fondo</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={card.backgroundImage}
                      onChange={(e) => updateCard(index, "backgroundImage", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Enlace (opcional)</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={card.href ?? ""}
                      onChange={(e) => updateCard(index, "href", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Titulo</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={card.title}
                      onChange={(e) => updateCard(index, "title", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Tamano titulo</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        type="number"
                        value={card.titleFontSize}
                        min={10}
                        max={96}
                        onChange={(e) => updateCard(index, "titleFontSize", parseInt(e.target.value) || 24)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Color titulo</Label>
                      <div className="[&_button]:h-8 [&_button]:text-[12px]">
                        <ColorField
                          value={card.titleColor}
                          onChange={(val) => updateCard(index, "titleColor", val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Descripcion</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={card.description}
                      onChange={(e) => updateCard(index, "description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Tamano descripcion</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        type="number"
                        value={card.descriptionFontSize}
                        min={10}
                        max={48}
                        onChange={(e) => updateCard(index, "descriptionFontSize", parseInt(e.target.value) || 14)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Color descripcion</Label>
                      <div className="[&_button]:h-8 [&_button]:text-[12px]">
                        <ColorField
                          value={card.descriptionColor}
                          onChange={(val) => updateCard(index, "descriptionColor", val)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Style */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Posicion contenido</Label>
                    <Select
                      value={card.contentPosition}
                      onValueChange={(val) => updateCard(index, "contentPosition", val)}
                    >
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flex-start" className="text-[12px]">Arriba</SelectItem>
                        <SelectItem value="center" className="text-[12px]">Centro</SelectItem>
                        <SelectItem value="flex-end" className="text-[12px]">Abajo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Alineacion texto</Label>
                    <Select
                      value={card.textAlign}
                      onValueChange={(val) => updateCard(index, "textAlign", val)}
                    >
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left" className="text-[12px]">Izquierda</SelectItem>
                        <SelectItem value="center" className="text-[12px]">Centro</SelectItem>
                        <SelectItem value="right" className="text-[12px]">Derecha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Color contenedor</Label>
                    <div className="[&_button]:h-8 [&_button]:text-[12px]">
                      <ColorField
                        value={card.boxBackgroundColor}
                        onChange={(val) => updateCard(index, "boxBackgroundColor", val)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Relleno contenedor</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        value={card.boxPadding}
                        onChange={(e) => updateCard(index, "boxPadding", e.target.value || "0px")}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Radio borde cont.</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        type="number"
                        value={card.boxBorderRadius}
                        min={0}
                        max={50}
                        onChange={(e) => updateCard(index, "boxBorderRadius", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Color overlay</Label>
                    <div className="[&_button]:h-8 [&_button]:text-[12px]">
                      <ColorField
                        value={card.overlayColor}
                        onChange={(val) => updateCard(index, "overlayColor", val)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Alto</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        value={card.height}
                        onChange={(e) => updateCard(index, "height", e.target.value)}
                        placeholder="350px"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] text-foreground/80">Radio borde</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        type="number"
                        value={card.borderRadius}
                        min={0}
                        max={50}
                        onChange={(e) => updateCard(index, "borderRadius", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Hover */}
                  <p className="text-[10px] font-semibold text-foreground/60">Hover</p>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Color contenedor (hover)</Label>
                    <div className="[&_button]:h-8 [&_button]:text-[12px]">
                      <ColorField
                        value={card.hoverBoxBackgroundColor}
                        onChange={(val) => updateCard(index, "hoverBoxBackgroundColor", val)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Color titulo (hover)</Label>
                    <div className="[&_button]:h-8 [&_button]:text-[12px]">
                      <ColorField
                        value={card.hoverTitleColor}
                        onChange={(val) => updateCard(index, "hoverTitleColor", val)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Color descripcion (hover)</Label>
                    <div className="[&_button]:h-8 [&_button]:text-[12px]">
                      <ColorField
                        value={card.hoverDescriptionColor}
                        onChange={(val) => updateCard(index, "hoverDescriptionColor", val)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Color overlay (hover)</Label>
                    <div className="[&_button]:h-8 [&_button]:text-[12px]">
                      <ColorField
                        value={card.hoverOverlayColor}
                        onChange={(val) => updateCard(index, "hoverOverlayColor", val)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
            )
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={addCard}
            className="w-full mt-3 h-8 text-[12px]"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Agregar Card
          </Button>
        </div>
      </SettingsSection>

      {/* La letra del bloque: la base que heredan las tarjetas que no traigan
          la suya. La tipografia por tarjeta sigue viviendo en su item, dentro
          de "Contenido", y gana sobre esta. */}
      <TypographySection />

      <SettingsSection title="Distribución">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Escritorio (≥1024px)</Label>
            <Select
              value={String(slidesDesktop)}
              onValueChange={(val) =>
                setProp(
                  (props: Required<EditableCardCarouselProps>) =>
                    (props.slidesDesktop = parseInt(val))
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {slidesOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Tableta (≥768px)</Label>
            <Select
              value={String(slidesTablet)}
              onValueChange={(val) =>
                setProp(
                  (props: Required<EditableCardCarouselProps>) =>
                    (props.slidesTablet = parseInt(val))
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {slidesOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Celular (&lt;768px)</Label>
            <Select
              value={String(slidesMobile)}
              onValueChange={(val) =>
                setProp(
                  (props: Required<EditableCardCarouselProps>) =>
                    (props.slidesMobile = parseInt(val))
                )
              }
            >
              <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {slidesOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Espaciado (gap px)</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              type="number"
              value={gap}
              min={0}
              max={64}
              onChange={(e) =>
                setProp(
                  (props: Required<EditableCardCarouselProps>) =>
                    (props.gap = parseInt(e.target.value) || 0)
                )
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Reproducción">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Intervalo auto-play (ms)</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              type="number"
              value={autoPlayInterval}
              min={0}
              step={500}
              onChange={(e) =>
                setProp(
                  (props: Required<EditableCardCarouselProps>) =>
                    (props.autoPlayInterval = parseInt(e.target.value) || 0)
                )
              }
            />
            <p className="text-[10px] text-foreground/60 mt-1">0 para desactivar</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="carousel-loop"
              checked={loop}
              onChange={(e) =>
                setProp(
                  (props: Required<EditableCardCarouselProps>) =>
                    (props.loop = e.target.checked)
                )
              }
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="carousel-loop" className="text-[11px] text-foreground/80">Loop infinito</Label>
          </div>
        </div>
      </SettingsSection>

      <SpacingSection />

      <BorderSection />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableCardCarouselProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableCardCarouselProps) => (props.customCss = val))
        }
      />
    </div>
  )
}

// ── CraftJS Config ─────────────────────────────────────

EditableCardCarousel.craft = {
  displayName: "Carrusel de tarjetas",
  props: {
    cards: defaultCards,
    slidesDesktop: 3,
    slidesTablet: 2,
    slidesMobile: 1,
    gap: 16,
    autoPlayInterval: 0,
    loop: true,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableCardCarouselSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
}
