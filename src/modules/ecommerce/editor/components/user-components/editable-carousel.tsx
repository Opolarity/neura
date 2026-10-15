import { useState, useEffect, useCallback } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight, GripVertical, Info } from "lucide-react"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import {
  SpacingSection,
  measureFromCss,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  generateId,
  reorderById,
  backfillIdsAndNames,
  needsBackfill,
  nextDefaultName,
  duplicateAt,
  useDragReorder,
} from "./drag-reorder"

interface BannerSlide {
  id?: string
  name?: string
  backgroundImage: string
  title: string
  subtitle: string
  ctaText: string
  ctaHref: string
  overlayColor: string
}

interface EditableCarouselProps {
  banners: BannerSlide[]
  height: string
  autoPlayInterval: number
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

export const defaultBanners: BannerSlide[] = [
  {
    backgroundImage: "/images/hero-banner.jpg",
    title: "Titulo del Banner",
    subtitle: "Subtitulo del banner con informacion relevante.",
    ctaText: "Ver mas",
    ctaHref: "/tienda",
    overlayColor: "rgba(0,0,0,0.5)",
  },
]

// El alto de siempre: un texto CSS —"400px"— que valia para los tres modos.
// La seccion lo enseña y lo migra al primer cambio.
function spacingLegacyOf(props: { height?: unknown }): SpacingLegacy {
  const alto = measureFromCss((props.height as string | undefined) ?? "400px")
  return { height: { desktop: alto, tablet: alto, mobile: alto } }
}

// La letra de siempre del carrusel, la que la seccion enseña mientras no haya
// nada guardado y migra al primer cambio. Es la misma declaracion que la de la
// portada, porque los dos bloques son lo mismo: textos sobre una imagen.
//
// Los textos colgaban de un contenedor sin letra propia, asi que su base real
// era el 16px heredado, el blanco con el que se escribian sobre la imagen y el
// centrado del contenedor. Declararlo aqui es lo que permite que el titulo y el
// subtitulo pasen a medirse en `em` sobre esa base sin que un carrusel ya
// publicado cambie de tamaño.
function typographyLegacyOf(): TypographyLegacy {
  return {
    size: uniformMeasure(16, "px"),
    textColor: "#ffffff",
    textAlign: "center",
  }
}

export function EditableCarousel(props: EditableCarouselProps) {
  const {
    banners = defaultBanners,
    autoPlayInterval = 5000,
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

  // El CSS escrito a mano en Avanzado. Lleva su propia clase para que el
  // usuario pueda pisar lo que aplica el componente.
  const { className: customCssClass, customCssTag } = useCustomCss(customCss)

  const borde = useBorderCss(props as Record<string, unknown>)
  const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))

  // La letra del bloque (ver TypographySection). Es la base que heredan los
  // textos del banner, asi que se aplica una vez en el contenedor del que
  // cuelgan: los banners no guardan letra propia.
  const letra = useTypographyCss(props as Record<string, unknown>, typographyLegacyOf())

  // El titulo nacio en monoespaciada mientras el resto heredaba la fuente del
  // sitio. Se conserva mientras el bloque no tenga fuente propia; en cuanto la
  // elige manda la del bloque, que si no la fuente no llegaria justo al texto
  // mas grande del banner.
  const tituloHeredaMono = props.fontFamily === undefined

  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }, [banners.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  useEffect(() => {
    if (enabled || banners.length <= 1 || autoPlayInterval <= 0) return
    const timer = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(timer)
  }, [enabled, banners.length, autoPlayInterval, goToNext])

  // Al volver de Preview a Edicion se rebobina: dejarlo parado en un banner
  // cualquiera se confunde con el contenido real del componente. Este carrusel
  // no usa embla, asi que no le vale el hook comun.
  useEffect(() => {
    if (enabled) setCurrentIndex(0)
  }, [enabled])

  useEffect(() => {
    if (currentIndex >= banners.length) {
      setCurrentIndex(0)
    }
  }, [banners.length, currentIndex])

  const slide = banners[currentIndex] || defaultBanners[0]

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
        src={slide.backgroundImage}
        alt={slide.title}
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
        style={{ backgroundColor: slide.overlayColor }}
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
            fijos: asi el titulo sigue siendo casi el doble que el subtitulo en
            lugar de aplanarse los dos al mismo numero cuando se toca el tamaño.
            El alto de linea del titulo si queda fijo, porque el suyo era mas
            apretado que el de un parrafo y perderlo lo separaria de golpe. */}
        <h2
          className={`text-[1.875em] font-bold tracking-tight leading-[1.2] ${tituloHeredaMono ? "font-mono" : ""}`}
        >
          {slide.title}
        </h2>
        {/* Atenuado respecto al color del bloque, no blanco fijo. */}
        <p className="mt-2 opacity-80 text-[0.875em] max-w-md">{slide.subtitle}</p>
        {slide.ctaText && (
          // El CTA lleva fondo propio, asi que conserva su color: el del bloque
          // es el de los textos, no el de una pastilla sobre el color primario.
          <span className="mt-4 inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-[0.875em] font-semibold">
            {slide.ctaText}
          </span>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all ${i === currentIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </SelectableNode>
    </>
  )
}

function EditableCarouselSettings() {
  const {
    actions: { setProp },
    banners,
    height,
    autoPlayInterval,
    customClass,
    customCss,
  } = useNode((node) => ({
    banners: node.data.props.banners as BannerSlide[],
    height: node.data.props.height as string,
    autoPlayInterval: node.data.props.autoPlayInterval as number,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
  }))

  // Que items estan desplegados, para tintar solo esas cabeceras.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const updateBanner = (
    index: number,
    field: keyof BannerSlide,
    value: string
  ) => {
    setProp((props: EditableCarouselProps) => {
      const newBanners = [...props.banners]
      newBanners[index] = { ...newBanners[index], [field]: value }
      props.banners = newBanners
    })
  }

  // Banners guardados antes de este cambio pueden no tener id/nombre.
  useEffect(() => {
    if (needsBackfill(banners)) {
      setProp((props: EditableCarouselProps) => {
        props.banners = backfillIdsAndNames(props.banners, "Banner")
      })
    }
  }, [banners, setProp])

  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
    useDragReorder((fromId, toId) => {
      setProp((props: EditableCarouselProps) => {
        props.banners = reorderById(props.banners, fromId, toId)
      })
    })

  const addBanner = () => {
    setProp((props: EditableCarouselProps) => {
      props.banners = [
        ...props.banners,
        {
          id: generateId(),
          name: nextDefaultName(props.banners, "Banner"),
          backgroundImage: "/images/hero-banner.jpg",
          title: "Nuevo Banner",
          subtitle: "Descripcion del banner.",
          ctaText: "Ver mas",
          ctaHref: "/tienda",
          overlayColor: "rgba(0,0,0,0.5)",
        },
      ]
    })
  }

  const duplicateBanner = (index: number) => {
    setProp((props: EditableCarouselProps) => {
      props.banners = duplicateAt(props.banners, index, "Banner")
    })
  }

  const removeBanner = (index: number) => {
    if (banners.length <= 1) return
    setProp((props: EditableCarouselProps) => {
      props.banners = props.banners.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          {banners.map((banner, index) => {
            const itemKey = banner.id ?? String(index)
            const isOpen = !!openItems[itemKey]
            const displayName = banner.name?.trim() || `Banner ${index + 1}`

            return (
            <Collapsible
              key={itemKey}
              open={isOpen}
              onOpenChange={(value) =>
                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
              }
            >
              <div
                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(banner.id)}`}
                onDragOver={(e) => handleDragOver(e, banner.id)}
                onDrop={(e) => handleDrop(e, banner.id)}
              >
                <CollapsibleTrigger asChild>
                  {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                      ocupan el alto completo de la fila y no quedan huecos
                      muertos que desplieguen el item por un click fallido.
                      La cabecera solo se tinta cuando el item esta desplegado. */}
                  <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                    <div className="flex items-stretch min-w-0 flex-1">
                      <span
                        draggable={!!banner.id}
                        onDragStart={(e) => {
                          e.stopPropagation()
                          if (banner.id) handleDragStart(e, banner.id)
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
                          duplicateBanner(index)
                        }}
                        title="Duplicar"
                        className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </div>

                      {banners.length > 1 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            removeBanner(index)
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
                          Solo se utiliza para identificar el banner dentro del editor.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      value={banner.name ?? ""}
                      onChange={(e) => updateBanner(index, "name", e.target.value)}
                      placeholder={`Banner ${index + 1}`}
                      className="h-8 text-[12px] md:text-[12px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground/80">Imagen de fondo</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={banner.backgroundImage}
                      onChange={(e) =>
                        updateBanner(index, "backgroundImage", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground/80">Titulo</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={banner.title}
                      onChange={(e) => updateBanner(index, "title", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground/80">Subtitulo</Label>
                    <Input
                      className="h-8 text-[12px] md:text-[12px]"
                      value={banner.subtitle}
                      onChange={(e) => updateBanner(index, "subtitle", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-foreground/80">Texto CTA</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        value={banner.ctaText}
                        onChange={(e) =>
                          updateBanner(index, "ctaText", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-foreground/80">Link CTA</Label>
                      <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        value={banner.ctaHref}
                        onChange={(e) =>
                          updateBanner(index, "ctaHref", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-bold text-foreground/80">Color overlay</Label>
                    <div className="[&_button]:h-8 [&_button]:text-[12px]">
                      <ColorField
                        value={banner.overlayColor}
                        onChange={(val) => updateBanner(index, "overlayColor", val)}
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
            onClick={addBanner}
            className="w-full mt-3 h-8 text-[12px]"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Agregar Banner
          </Button>
        </div>
      </SettingsSection>

      <TypographySection legacy={typographyLegacyOf()} />

      <SpacingSection legacy={spacingLegacyOf({ height })} />

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
                  (props: EditableCarouselProps) =>
                    (props.autoPlayInterval = parseInt(e.target.value) || 0)
                )
              }
            />
            <p className="text-[10px] text-foreground/60 mt-1">
              0 para desactivar
            </p>
          </div>
        </div>
      </SettingsSection>

      <BorderSection />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableCarouselProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableCarouselProps) => (props.customCss = val))
        }
      />
    </div>
  )
}

EditableCarousel.craft = {
  displayName: "Carrusel de banners",
  props: {
    banners: defaultBanners,
    height: "400px",
    autoPlayInterval: 5000,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableCarouselSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
}
