import { useEffect, useState, useMemo } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useEditorCarouselReset } from "@/modules/ecommerce/editor/hooks/use-editor-carousel-reset"
import { useCatalogCategory } from "@/modules/ecommerce/editor/tienda/catalog-category-context"
import Autoplay from "embla-carousel-autoplay"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Copy, ImageIcon, GripVertical, Info } from "lucide-react"
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
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import {
    SpacingSection,
    measureFromCss,
    spacingRulesByViewport,
    useSpacingCss,
    type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import {
    TypographySection,
    useTypographyCss,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// ── Types ──────────────────────────────────────────────

interface CategorySlide {
    id?: string
    name?: string
    src: string
    srcMobile?: string
    alt: string
    fit?: "cover" | "contain" | "fill"
    // Ids de categoria separados por coma. Vacio = visible en todas las categorias.
    categoryIds?: string
}

interface EditableCategoryCarouselProps {
    slides?: CategorySlide[]
    // Inserta como slide la imagen propia de la categoria activa (viene de BD via contexto).
    showCategoryImage?: boolean
    categoryImagePlacement?: "start" | "end"
    autoplay?: boolean
    interval?: number
    showArrows?: boolean
    showIndicators?: boolean
    /**
     * @deprecated El alto como texto CSS; "auto" es la altura natural de la
     * imagen, que es el comportamiento del banner del catalogo. Se sigue
     * leyendo porque lo traen los carruseles ya publicados; hoy el alto va
     * por modo y con su unidad (ver SpacingSection) y esto solo alimenta su
     * `legacy`.
     */
    heightDesktop?: string
    /** @deprecated Mismo motivo que `heightDesktop`. */
    heightMobile?: string
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    borderStyle?: BorderStyle
    borderColor?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
    /**
     * Grosores y radios de borde, medidas y letra por modo de pantalla. Ver
     * BorderSection, SpacingSection y TypographySection.
     */
    [key: string]: unknown
}

const defaultSlides: CategorySlide[] = [
    { id: "slide1", name: "Slide 1", src: "/images/hero-banner.jpg", alt: "Slide 1", categoryIds: "" },
]

function matchesCategory(slide: CategorySlide, categoryId: number | null): boolean {
    const ids = (slide.categoryIds || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !Number.isNaN(n))
    if (ids.length === 0) return true
    return categoryId !== null && ids.includes(categoryId)
}

// El alto del formato anterior: dos textos CSS ("auto" = altura natural de la
// imagen) que se migran al primer cambio. El breakpoint de este carrusel
// siempre fue 1024, asi que la tableta cae con el celular.
function spacingLegacyOf(props: {
    heightDesktop?: unknown
    heightMobile?: unknown
}): SpacingLegacy {
    const desktop = (props.heightDesktop as string | number | undefined) ?? "auto"
    const mobile = (props.heightMobile as string | number | undefined) ?? "auto"
    return {
        height: {
            desktop: measureFromCss(desktop),
            tablet: measureFromCss(mobile),
            mobile: measureFromCss(mobile),
        },
    }
}

// ── Component ──────────────────────────────────────────

export function EditableCategoryCarousel(props: EditableCategoryCarouselProps) {
    const {
        slides = defaultSlides,
        showCategoryImage = true,
        categoryImagePlacement = "start",
        autoplay = false,
        interval = 3000,
        showArrows = true,
        showIndicators = false,
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

    // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la
    // del carrusel, para que el usuario pueda pisarla si quiere.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    const borde = useBorderCss(props as Record<string, unknown>)
    const spacingLegacy = spacingLegacyOf(props)
    // El alto va en el bloque (lo pinta el hook); por dentro, el carrusel y
    // la imagen se estiran hasta el con h-full.
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacy)
    // Con alto definido la imagen se recorta al bloque; sin el, altura natural.
    // Se mira en las reglas que emite la seccion, que ya resuelven el legado
    // ("auto" no emite nada) y las medidas por modo.
    const reglas = spacingRulesByViewport(props as Record<string, unknown>, spacingLegacy)
    const useFixedHeight = /(^|[^-])height:/.test(
        `${reglas.desktop} ${reglas.tablet} ${reglas.mobile}`
    )
    // La letra del bloque, en el mismo contenedor que el borde y las medidas:
    // es la base que heredaria cualquier texto de las slides. Hoy solo pinta
    // imagenes, asi que no se ve nada hasta que algo escriba texto dentro. Sin
    // legado: este carrusel nunca guardo tipografia propia.
    const letra = useTypographyCss(props as Record<string, unknown>)

    const catalog = useCatalogCategory()

    type RenderSlide = CategorySlide & { isCategoryImage?: boolean }

    const visibleSlides = useMemo<RenderSlide[]>(() => {
        // En el editor no hay contexto de catalogo: se muestran todas las slides
        // (con badge de categorias) mas un placeholder de la imagen de categoria.
        const base: RenderSlide[] = enabled
            ? [...slides]
            : slides.filter((s) => matchesCategory(s, catalog?.categoryId ?? null))

        if (showCategoryImage) {
            const categorySlide: RenderSlide | null = enabled
                ? { src: "", alt: "Imagen de la categoria (BD)", isCategoryImage: true }
                : catalog?.categoryImage
                    ? { src: catalog.categoryImage, alt: catalog.categoryName, isCategoryImage: true }
                    : null
            if (categorySlide) {
                if (categoryImagePlacement === "end") base.push(categorySlide)
                else base.unshift(categorySlide)
            }
        }
        return base
    }, [enabled, slides, showCategoryImage, categoryImagePlacement, catalog])

    const plugins =
        autoplay && !enabled
            ? [Autoplay({ delay: interval, stopOnInteraction: true })]
            : []

    const [api, setApi] = useState<any>()
    useEditorCarouselReset(api)
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (!api) return
        setCurrent(api.selectedScrollSnap())
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    if (!enabled && visibleSlides.length === 0) return null

    // Con alto definido el bloque es una columna: el carrusel se lleva lo que
    // dejan los indicadores y, por dentro, cada capa (el overflow-hidden de
    // embla incluido, via [&>div]) va a h-full para que la imagen tenga contra
    // que estirarse.
    const imgHeightClass = useFixedHeight ? "h-full" : ""

    return (
        <>
            {visibilityJsx}
            {customCssTag}
            {borde.styleTag}
            {medidas.styleTag}
            {letra.styleTag}
            <SelectableNode className={`w-full ${useFixedHeight ? "flex flex-col" : ""} ${borde.className} ${medidas.className} ${letra.className} ${visClass} ${customCssClass} ${customClass}`}>
                <Carousel
                    setApi={setApi}
                    opts={{ loop: true }}
                    plugins={plugins}
                    className={useFixedHeight ? "w-full flex-1 min-h-0 [&>div]:h-full" : "w-full"}
                >
                    <CarouselContent className={useFixedHeight ? "h-full" : undefined}>
                        {visibleSlides.length > 0 ? (
                            visibleSlides.map((slide, index) => (
                                <CarouselItem key={index} className={`!p-0 relative ${imgHeightClass}`}>
                                    {slide.isCategoryImage && !slide.src ? (
                                        <div className="w-full h-[200px] flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-muted-foreground/20 text-muted-foreground">
                                            <ImageIcon className="h-8 w-8 mb-2 opacity-30" />
                                            <p className="text-sm font-medium">Imagen de la categoría activa</p>
                                            <p className="text-[10px] opacity-60">Se muestra la imagen de BD de la categoría del catálogo</p>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={slide.src}
                                                alt={slide.alt}
                                                className={`w-full ${imgHeightClass} ${slide.srcMobile ? "hidden md:block" : ""}`}
                                                style={{ objectFit: slide.fit || "cover" }}
                                            />
                                            {slide.srcMobile && (
                                                <img
                                                    src={slide.srcMobile}
                                                    alt={slide.alt}
                                                    className={`w-full ${imgHeightClass} md:hidden`}
                                                    style={{ objectFit: slide.fit || "cover" }}
                                                />
                                            )}
                                        </>
                                    )}
                                    {enabled && !slide.isCategoryImage && (
                                        <span className="absolute bottom-1 left-1 z-10 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none">
                                            {(slide.categoryIds || "").trim()
                                                ? `Categorías: ${slide.categoryIds}`
                                                : "Todas las categorías"}
                                        </span>
                                    )}
                                </CarouselItem>
                            ))
                        ) : (
                            <CarouselItem className="!p-0">
                                <div className="w-full h-[200px] flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-muted-foreground/20 text-muted-foreground">
                                    <Plus className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Sin imágenes en el carrusel</p>
                                    <p className="text-[10px] opacity-60">Agrega imágenes desde el panel de ajustes</p>
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>

                    {showArrows && visibleSlides.length > 1 && (
                        <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                        </>
                    )}
                </Carousel>

                {showIndicators && visibleSlides.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {visibleSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => api?.scrollTo(index)}
                                className={`h-2 w-2 rounded-full transition ${current === index
                                    ? "bg-primary"
                                    : "bg-muted-foreground/30"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </SelectableNode>
        </>
    )
}

// ── Settings ───────────────────────────────────────────

function EditableCategoryCarouselSettings() {
    const {
        actions: { setProp },
        slides,
        showCategoryImage,
        categoryImagePlacement,
        autoplay,
        interval,
        showArrows,
        showIndicators,
        heightDesktop,
        heightMobile,
        customClass,
        customCss,
    } = useNode((node) => ({
        slides: node.data.props.slides as CategorySlide[],
        showCategoryImage: node.data.props.showCategoryImage as boolean,
        categoryImagePlacement: node.data.props.categoryImagePlacement as "start" | "end",
        autoplay: node.data.props.autoplay as boolean,
        interval: node.data.props.interval as number,
        showArrows: node.data.props.showArrows as boolean,
        showIndicators: node.data.props.showIndicators as boolean,
        heightDesktop: node.data.props.heightDesktop as string,
        heightMobile: node.data.props.heightMobile as string,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
    }))

    // Que items estan desplegados, para tintar solo esas cabeceras.
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

    const updateSlide = (index: number, field: keyof CategorySlide, value: string) => {
        setProp((props: Required<EditableCategoryCarouselProps>) => {
            const newSlides = [...props.slides]
            newSlides[index] = { ...newSlides[index], [field]: value }
            props.slides = newSlides
        })
    }

    const addSlide = () => {
        setProp((props: Required<EditableCategoryCarouselProps>) => {
            const name = nextDefaultName(props.slides, "Tarjeta")
            props.slides = [
                ...props.slides,
                { id: generateId(), name, src: "/images/hero-banner.jpg", alt: name, categoryIds: "" },
            ]
        })
    }

    const duplicateSlide = (index: number) => {
        setProp((props: Required<EditableCategoryCarouselProps>) => {
            props.slides = duplicateAt(props.slides, index, "Tarjeta")
        })
    }

    const removeSlide = (index: number) => {
        setProp((props: Required<EditableCategoryCarouselProps>) => {
            props.slides = props.slides.filter((_, i) => i !== index)
        })
    }

    // Slides guardadas antes de este cambio pueden no tener id/nombre.
    useEffect(() => {
        if (needsBackfill(slides)) {
            setProp((props: Required<EditableCategoryCarouselProps>) => {
                props.slides = backfillIdsAndNames(props.slides, "Slide")
            })
        }
    }, [slides, setProp])

    const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
        useDragReorder((fromId, toId) => {
            setProp((props: Required<EditableCategoryCarouselProps>) => {
                props.slides = reorderById(props.slides, fromId, toId)
            })
        })

    return (
        <div className="flex flex-col">
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
                                        <Label className="text-[11px] font-bold text-foreground/80">URL Imagen (desktop)</Label>
                                        <Input
                                            className="h-8 text-[12px] md:text-[12px]"
                                            value={slide.src}
                                            onChange={(e) => updateSlide(index, "src", e.target.value)}
                                            placeholder="URL imagen"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">URL Imagen mobile (opcional)</Label>
                                        <Input
                                            className="h-8 text-[12px] md:text-[12px]"
                                            value={slide.srcMobile || ""}
                                            onChange={(e) => updateSlide(index, "srcMobile", e.target.value)}
                                            placeholder="URL imagen mobile"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Texto alternativo</Label>
                                        <Input
                                            className="h-8 text-[12px] md:text-[12px]"
                                            value={slide.alt}
                                            onChange={(e) => updateSlide(index, "alt", e.target.value)}
                                            placeholder="Alt"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Ids de categoría (coma, vacío = todas)</Label>
                                        <Input
                                            className="h-8 text-[12px] md:text-[12px]"
                                            value={slide.categoryIds || ""}
                                            onChange={(e) => updateSlide(index, "categoryIds", e.target.value)}
                                            placeholder="Ej: 12, 15"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Ajuste visual (Object Fit)</Label>
                                        <Select
                                            value={slide.fit || "cover"}
                                            onValueChange={(val) => updateSlide(index, "fit", val)}
                                        >
                                            <SelectTrigger className="h-8 text-[12px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem className="text-[12px]" value="cover">Cubrir (Corta bordes)</SelectItem>
                                                <SelectItem className="text-[12px]" value="contain">Contener (Completa)</SelectItem>
                                                <SelectItem className="text-[12px]" value="fill">Rellenar (Estirar)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                        )
                    })}
                </div>
                <Button variant="outline" size="sm" onClick={addSlide} className="w-full mt-3 h-8 text-[12px]">
                    <Plus className="h-3 w-3 mr-2" />
                    Agregar slide
                </Button>
            </SettingsSection>

            <SettingsSection title="Imagen de categoría">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={showCategoryImage}
                            onCheckedChange={(val) =>
                                setProp((props: Required<EditableCategoryCarouselProps>) => {
                                    props.showCategoryImage = Boolean(val)
                                })
                            }
                        />
                        <Label className="text-[11px] text-foreground/80">Incluir imagen de la categoría (BD)</Label>
                    </div>

                    {showCategoryImage && (
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Ubicación de la imagen de categoría</Label>
                            <Select
                                value={categoryImagePlacement || "start"}
                                onValueChange={(val) =>
                                    setProp((props: Required<EditableCategoryCarouselProps>) => {
                                        props.categoryImagePlacement = val as "start" | "end"
                                    })
                                }
                            >
                                <SelectTrigger className="h-8 text-[12px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="text-[12px]" value="start">Al inicio</SelectItem>
                                    <SelectItem className="text-[12px]" value="end">Al final</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </SettingsSection>

            <SettingsSection title="Carrusel">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={autoplay}
                            onCheckedChange={(val) =>
                                setProp((props: Required<EditableCategoryCarouselProps>) => {
                                    props.autoplay = Boolean(val)
                                })
                            }
                        />
                        <Label className="text-[11px] text-foreground/80">Autoplay</Label>
                    </div>

                    {autoplay && (
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Intervalo (ms)</Label>
                            <Input
                                className="h-8 text-[12px] md:text-[12px]"
                                type="number"
                                value={interval}
                                min={1000}
                                step={500}
                                onChange={(e) =>
                                    setProp((props: Required<EditableCategoryCarouselProps>) => {
                                        props.interval = parseInt(e.target.value) || 3000
                                    })
                                }
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={showArrows}
                            onCheckedChange={(val) =>
                                setProp((props: Required<EditableCategoryCarouselProps>) => {
                                    props.showArrows = Boolean(val)
                                })
                            }
                        />
                        <Label className="text-[11px] text-foreground/80">Flechas</Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={showIndicators}
                            onCheckedChange={(val) =>
                                setProp((props: Required<EditableCategoryCarouselProps>) => {
                                    props.showIndicators = Boolean(val)
                                })
                            }
                        />
                        <Label className="text-[11px] text-foreground/80">Indicadores</Label>
                    </div>
                </div>
            </SettingsSection>

            <TypographySection />

            <SpacingSection legacy={spacingLegacyOf({ heightDesktop, heightMobile })} />

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp(
                        (props: EditableCategoryCarouselProps) =>
                            (props.customClass = val),
                    )
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp(
                        (props: EditableCategoryCarouselProps) =>
                            (props.customCss = val),
                    )
                }
            />
        </div>
    )
}

EditableCategoryCarousel.craft = {
    displayName: "Carrusel de categorías",
    props: {
        slides: defaultSlides,
        showCategoryImage: true,
        categoryImagePlacement: "start",
        autoplay: false,
        interval: 3000,
        showArrows: true,
        showIndicators: false,
        heightDesktop: "auto",
        heightMobile: "auto",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableCategoryCarouselSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
