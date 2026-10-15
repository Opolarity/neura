import { useEditor, useNode } from "@craftjs/core"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Copy, GripVertical, Info } from "lucide-react"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useEffect, useState } from "react"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import {
  SpacingSection,
  uniformMeasure,
  useSpacingCss,
  type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import {
  TypographySection,
  useTypographyCss,
  type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Slide {
  id?: string
  name?: string
  image: string
  subtitle: string
  title: string
  titleAccent: string
  description: string
  ctaLabel: string
  ctaHref: string
}

interface EditableHeroProps {
  slides: Slide[]
  overlayOpacity?: number
  customClass?: string
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string
  borderStyle?: BorderStyle
  borderColor?: string
  hiddenOnDesktop?: boolean
  hiddenOnTablet?: boolean
  hiddenOnMobile?: boolean
  /**
   * Grosores y radios de borde por modo de pantalla (BorderSection) y la letra
   * del bloque (TypographySection), que escriben sus props aqui sin declararlas
   * una a una.
   */
  [key: string]: unknown
}

// El alto de siempre era un 500px fijo que nadie controlaba; ahora es el
// legado que la seccion enseña y migra al primer cambio.
function spacingLegacyOf(): SpacingLegacy {
  return { height: uniformMeasure(500, "px") }
}

// La letra de siempre de la portada, la que la seccion enseña mientras no haya
// nada guardado y migra al primer cambio.
//
// Los textos colgaban de un contenedor sin letra propia, asi que su base real
// era el 16px heredado, el blanco con el que se escribian sobre la imagen y el
// centrado del contenedor. Declararlo aqui es lo que permite que el titulo y el
// subtitulo pasen a medirse en `em` sobre esa base sin que una portada ya
// publicada cambie de tamaño.
function typographyLegacyOf(): TypographyLegacy {
  return {
    size: uniformMeasure(16, "px"),
    textColor: "#ffffff",
    textAlign: "center",
  }
}

const defaultSlides: Slide[] = [
  {
    image: "/images/hero-banner.jpg",
    subtitle: "Nueva Coleccion 2026",
    title: "DEFINE TU",
    titleAccent: "ESTILO",
    description: "Streetwear urbano con disenos exclusivos.",
    ctaLabel: "Explorar Tienda",
    ctaHref: "/tienda",
  },
]

export function EditableHero(props: EditableHeroProps) {
  const {
    slides = defaultSlides,
    overlayOpacity = 60,
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

  const borde = useBorderCss(props as Record<string, unknown>)
  const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf())

  // La letra del bloque (ver TypographySection). Es la base que heredan los
  // textos de la diapositiva, asi que se aplica una vez en el contenedor del
  // que cuelgan: las slides no guardan letra propia.
  const letra = useTypographyCss(props as Record<string, unknown>, typographyLegacyOf())

  // El titulo nacio en monoespaciada mientras el resto heredaba la fuente del
  // sitio. Se conserva mientras el bloque no tenga fuente propia; en cuanto la
  // elige manda la del bloque, que si no la fuente no llegaria justo al texto
  // mas grande de la portada.
  const tituloHeredaMono = props.fontFamily === undefined

  const currentSlide = slides[0] || defaultSlides[0]

  return (
    <>
    {visibilityJsx}
    {customCssTag}
    {borde.styleTag}
    {medidas.styleTag}
    {letra.styleTag}
    <SelectableNode
      className={`w-full overflow-hidden ${borde.className} ${medidas.className} ${visClass} ${customCssClass} ${customClass}`}
    >
      <img
        src={currentSlide.image}
        alt={`${currentSlide.title} ${currentSlide.titleAccent}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          inset: 0,
        }}
      />

      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }}
      />

      {/* La letra va en este contenedor, que es del que cuelgan los textos. El
          overlay es el hermano de arriba y se posiciona contra el wrapper, asi
          que este `relative` —lo que deja los textos por encima— no se toca.
          El centrado tampoco se escribe aqui: lo pone la alineacion del bloque,
          que arranca centrada por legado. */}
      <div
        className={`relative h-full flex flex-col items-center justify-center px-4 ${letra.className}`}
      >
        {/* Los tamaños van en `em` sobre la base del bloque en vez de en px
            fijos: asi el titulo sigue siendo tres veces el subtitulo en lugar de
            aplanarse todo al mismo numero cuando se toca el tamaño. Lo mismo con
            el color: los textos atenuados lo son respecto al del bloque. */}
        <p className="text-[0.875em] font-semibold tracking-[0.3em] uppercase mb-4 opacity-80">
          {currentSlide.subtitle}
        </p>
        <h2
          className={`text-[3em] font-bold tracking-tighter leading-none ${tituloHeredaMono ? "font-mono" : ""}`}
        >
          {currentSlide.title}
          <br />
          {/* El acento conserva su color propio: esa es su distincion frente a
              la base, y sigue destacando aunque el bloque cambie de color. */}
          <span className="text-green-400">{currentSlide.titleAccent}</span>
        </h2>
        {/* Sin tamaño propio: la descripcion es la base del bloque. */}
        <p className="mt-4 opacity-70 max-w-md">
          {currentSlide.description}
        </p>
        <div className="mt-6">
          {/* El CTA lleva fondo propio, asi que conserva su blanco: el color del
              bloque es el de los textos, no el de una pastilla sobre verde. */}
          <span className="inline-block bg-green-500 text-white px-6 py-3 rounded-md text-[0.875em] font-semibold">
            {currentSlide.ctaLabel}
          </span>
        </div>
        {slides.length > 1 && (
          <div className="absolute bottom-4 flex gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full ${i === 0 ? "w-8 bg-green-400" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </SelectableNode>
    </>
  )
}

function EditableHeroSettings() {
  const {
    actions: { setProp },
    slides,
    overlayOpacity,
    customClass,
    customCss,
  } = useNode((node) => ({
    slides: node.data.props.slides as Slide[],
    overlayOpacity: node.data.props.overlayOpacity as number,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
  }))

  // Que items estan desplegados, para tintar solo esas cabeceras.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const updateSlide = (index: number, field: keyof Slide, value: string) => {
    setProp((props: EditableHeroProps) => {
      const newSlides = [...props.slides]
      newSlides[index] = { ...newSlides[index], [field]: value }
      props.slides = newSlides
    })
  }

  // Slides guardadas antes de este cambio pueden no tener id/nombre.
  useEffect(() => {
    if (needsBackfill(slides)) {
      setProp((props: EditableHeroProps) => {
        props.slides = backfillIdsAndNames(props.slides, "Slide")
      })
    }
  }, [slides, setProp])

  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
    useDragReorder((fromId, toId) => {
      setProp((props: EditableHeroProps) => {
        props.slides = reorderById(props.slides, fromId, toId)
      })
    })

  const addSlide = () => {
    setProp((props: EditableHeroProps) => {
      props.slides = [
        ...props.slides,
        {
          id: generateId(),
          name: nextDefaultName(props.slides, "Tarjeta"),
          image: "/images/hero-banner.jpg",
          subtitle: "Nuevo Slide",
          title: "TITULO",
          titleAccent: "ACENTO",
          description: "Descripcion del slide.",
          ctaLabel: "Ver mas",
          ctaHref: "/tienda",
        },
      ]
    })
  }

  const duplicateSlide = (index: number) => {
    setProp((props: EditableHeroProps) => {
      props.slides = duplicateAt(props.slides, index, "Tarjeta")
    })
  }

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return
    setProp((props: EditableHeroProps) => {
      props.slides = props.slides.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="flex flex-col">
      {/* ── Slides Management ── */}
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          {slides.map((slide, index) => {
            const itemKey = slide.id ?? String(index)
            const isOpen = !!openItems[itemKey]
            const displayName = slide.name?.trim() || `Tarjeta ${index + 1}`

            return (
            <Collapsible
              key={itemKey}
              open={isOpen}
              onOpenChange={(value) =>
                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
              }
            >
              <div
                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(slide.id)}`}
                onDragOver={(e) => handleDragOver(e, slide.id)}
                onDrop={(e) => handleDrop(e, slide.id)}
              >
                <CollapsibleTrigger asChild>
                  {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                      ocupan el alto completo de la fila y no quedan huecos
                      muertos que desplieguen el item por un click fallido.
                      La cabecera solo se tinta cuando el item esta desplegado. */}
                  <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                    <div className="flex items-stretch min-w-0 flex-1">
                      <span
                        draggable={!!slide.id}
                        onDragStart={(e) => {
                          e.stopPropagation()
                          if (slide.id) handleDragStart(e, slide.id)
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
                          duplicateSlide(index)
                        }}
                        title="Duplicar"
                        className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </div>

                      {slides.length > 1 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSlide(index)
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
                      value={slide.name ?? ""}
                      onChange={(e) => updateSlide(index, "name", e.target.value)}
                      placeholder={`Tarjeta ${index + 1}`}
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground/80">Imagen URL</Label>
                    <Input
                      value={slide.image}
                      onChange={(e) => updateSlide(index, "image", e.target.value)}
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground/80">Subtitulo</Label>
                    <Input
                      value={slide.subtitle}
                      onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-foreground/80">Titulo</Label>
                      <Input
                        value={slide.title}
                        onChange={(e) => updateSlide(index, "title", e.target.value)}
                        className="h-8 text-[12px] md:text-[12px]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-foreground/80">Acento</Label>
                      <Input
                        value={slide.titleAccent}
                        onChange={(e) =>
                          updateSlide(index, "titleAccent", e.target.value)
                        }
                        className="h-8 text-[12px] md:text-[12px]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground/80">Descripcion</Label>
                    <Input
                      value={slide.description}
                      onChange={(e) =>
                        updateSlide(index, "description", e.target.value)
                      }
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-foreground/80">CTA Texto</Label>
                      <Input
                        value={slide.ctaLabel}
                        onChange={(e) =>
                          updateSlide(index, "ctaLabel", e.target.value)
                        }
                        className="h-8 text-[12px] md:text-[12px]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-foreground/80">CTA Link</Label>
                      <Input
                        value={slide.ctaHref}
                        onChange={(e) =>
                          updateSlide(index, "ctaHref", e.target.value)
                        }
                        className="h-8 text-[12px] md:text-[12px]"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
            )
          })}
        </div>

        <Button variant="outline" size="sm" onClick={addSlide} className="w-full mt-3 h-8 text-[12px]">
          <Plus className="h-3 w-3 mr-2" />
          Agregar Slide
        </Button>
      </SettingsSection>

      <TypographySection legacy={typographyLegacyOf()} />

      {/* ── Style Settings ── */}
      <SettingsSection title="Estilos">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Opacidad del overlay</Label>
            <Input
              type="number"
              value={overlayOpacity}
              min={0}
              max={100}
              onChange={(e) =>
                setProp(
                  (props: EditableHeroProps) =>
                    (props.overlayOpacity = parseInt(e.target.value) || 60)
                )
              }
              className="h-8 text-[12px] md:text-[12px]"
            />
          </div>
        </div>
      </SettingsSection>

      <SpacingSection legacy={spacingLegacyOf()} />

      <BorderSection />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableHeroProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableHeroProps) => (props.customCss = val))
        }
      />
    </div>
  )
}

EditableHero.craft = {
  displayName: "Portada",
  props: {
    slides: defaultSlides,
    overlayOpacity: 60,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableHeroSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
}
