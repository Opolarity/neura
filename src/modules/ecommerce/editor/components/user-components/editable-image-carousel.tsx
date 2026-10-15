import { useEffect, useState } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useEditorCarouselReset } from "@/modules/ecommerce/editor/hooks/use-editor-carousel-reset"
import Autoplay from "embla-carousel-autoplay"
import AutoHeight from "embla-carousel-auto-height"
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { TypographySection, useTypographyCss } from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"

// ── Types ──────────────────────────────────────────────

interface ImageSlide {
    id?: string
    name?: string
    src: string
    alt: string
    fit?: 'cover' | 'contain' | 'fill'
}

interface EditableImageCarouselProps {
    images?: ImageSlide[]
    autoplay?: boolean
    interval?: number
    showArrows?: boolean
    showIndicators?: boolean
    /**
     * @deprecated El alto como texto CSS. Se sigue leyendo porque lo traen
     * los carruseles ya publicados; hoy el alto va por modo y con su unidad
     * (ver SpacingSection) y esto solo alimenta su `legacy`.
     */
    heightDesktop?: string
    /** @deprecated Mismo motivo que `heightDesktop`. */
    heightTablet?: string
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
    /** Grosores y radios de borde por modo de pantalla. Ver BorderSection. */
    [key: string]: unknown
}

const defaultImages: ImageSlide[] = [
    { src: "/images/hero-banner.jpg", alt: "Slide 1" },
    { src: "/images/hero-banner.jpg", alt: "Slide 2" },
]

// El alto del formato anterior: tres textos CSS ("400px", "auto", "") que se
// migran al primer cambio. Sin alto propio el carrusel se adapta a cada
// imagen, y la tableta cae con el celular mientras no tenga alto propio: el
// breakpoint de este carrusel siempre fue 1024, asi que los carruseles ya
// publicados se siguen viendo igual en el rango 768-1023.
function spacingLegacyOf(props: {
    heightDesktop?: unknown
    heightTablet?: unknown
    heightMobile?: unknown
}): SpacingLegacy {
    const desktop = props.heightDesktop as string | number | undefined
    const tablet = props.heightTablet as string | number | undefined
    const mobile = props.heightMobile as string | number | undefined
    return {
        height: {
            desktop: measureFromCss(desktop),
            tablet: measureFromCss(tablet || mobile),
            mobile: measureFromCss(mobile),
        },
    }
}

// ── Component ──────────────────────────────────────────

export function EditableImageCarousel(props: EditableImageCarouselProps) {
    const {
        images = defaultImages,
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

    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    const borde = useBorderCss(props as Record<string, unknown>)
    const spacingLegacy = spacingLegacyOf(props)
    // El alto va en el bloque (lo pinta el hook); por dentro, el carrusel y
    // la imagen se estiran hasta el con h-full.
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacy)

    // La letra del bloque, de la seccion "Tipografía". Este carrusel hoy solo
    // pinta imagenes —el `alt` de cada slide no se ve—, asi que la seccion
    // queda como base heredada: sin valores guardados no emite ninguna regla y
    // nada cambia, y si el bloque llega a llevar texto ya esta puesta. No lleva
    // legado porque nunca guardo tipografia propia con otros nombres.
    const letra = useTypographyCss(props as Record<string, unknown>)

    // El alto definido manda. Solo cuando no hay ninguno el carrusel se adapta
    // a cada imagen; asi no se paga el trabajo de medir slides cuando el alto
    // ya no depende de lo que contienen. Se mira en las reglas que emite la
    // seccion, que ya resuelven el legado y las medidas por modo.
    const reglas = spacingRulesByViewport(props as Record<string, unknown>, spacingLegacy)
    const hasFixedHeight = /(^|[^-])height:/.test(
        `${reglas.desktop} ${reglas.tablet} ${reglas.mobile}`
    )

    const plugins = [
        ...(autoplay && !enabled
            ? [Autoplay({ delay: interval, stopOnInteraction: true })]
            : []),
        // Ajusta el alto del carrusel al de la imagen que se esta viendo. Sin
        // el, el contenedor se queda con el alto de la imagen mas alta y las
        // demas dejan un hueco por debajo.
        ...(hasFixedHeight ? [] : [AutoHeight()]),
    ]

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

    return (
        <>
            {visibilityJsx}
            {customCssTag}
            {borde.styleTag}
            {medidas.styleTag}
            {letra.styleTag}
            {/* Con alto definido el bloque es una columna: el carrusel se
                lleva lo que dejan los indicadores y, por dentro, cada capa
                (el overflow-hidden de embla incluido, via [&>div]) va a h-full
                para que la imagen tenga contra que estirarse. */}
            <SelectableNode
                className={`w-full bg-[#1F1F1F] ${hasFixedHeight ? "flex flex-col" : ""} ${borde.className} ${medidas.className} ${letra.className} ${visClass} ${customCssClass} ${customClass}`}
            >
                <Carousel
                    setApi={setApi}
                    opts={{ loop: true }}
                    plugins={plugins}
                    className={hasFixedHeight ? "w-full flex-1 min-h-0 [&>div]:h-full" : "w-full"}
                >
                    {/* items-start es obligatorio para el plugin: sin el, el
                        flex estira cada slide al alto del mas alto y no habria
                        nada que adaptar. La transicion suaviza el salto de alto
                        al cambiar de imagen. */}
                    <CarouselContent
                        className={
                            hasFixedHeight
                                ? "h-full"
                                : "items-start transition-[height] duration-200"
                        }
                    >
                        {images.length > 0 ? (
                            images.map((img, index) => (
                                <CarouselItem key={index} className={hasFixedHeight ? "!p-0 h-full" : "!p-0"}>
                                    <img
                                        src={img.src}
                                        alt={img.alt}
                                        // Con alto libre la imagen manda, asi que
                                        // no se recorta: object-fit solo pinta
                                        // algo cuando hay un alto que rellenar.
                                        className={
                                            hasFixedHeight
                                                ? "w-full h-full"
                                                : "block w-full h-auto"
                                        }
                                        style={
                                            hasFixedHeight
                                                ? { objectFit: img.fit || "cover" }
                                                : undefined
                                        }
                                    />
                                </CarouselItem>
                            ))
                        ) : (
                            <CarouselItem className={hasFixedHeight ? "!p-0 h-full" : "!p-0"}>
                                <div className={`${hasFixedHeight ? "h-full" : "min-h-[240px]"} w-full flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-muted-foreground/20 text-muted-foreground`}>
                                    <Plus className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Sin imágenes en el carrusel</p>
                                    <p className="text-[10px] opacity-60">Agrega imágenes desde el panel de ajustes</p>
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>

                    {showArrows && (
                        <>
                            <CarouselPrevious className="left-4 bg-black/40 border-0 text-white" />
                            <CarouselNext className="right-4 bg-black/40 border-0 text-white" />
                        </>
                    )}
                </Carousel>

                {/* Indicators */}
                {showIndicators && (
                    <div className="flex justify-center gap-2 mt-4">
                        {images.map((_, index) => (
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

function EditableImageCarouselSettings() {
    const {
        actions: { setProp },
        images,
        autoplay,
        interval,
        showArrows,
        showIndicators,
        heightDesktop,
        heightTablet,
        heightMobile,
        customClass,
        customCss,
    } = useNode((node) => ({
        images: node.data.props.images as ImageSlide[],
        autoplay: node.data.props.autoplay as boolean,
        interval: node.data.props.interval as number,
        showArrows: node.data.props.showArrows as boolean,
        showIndicators: node.data.props.showIndicators as boolean,
        heightDesktop: node.data.props.heightDesktop as string,
        heightTablet: node.data.props.heightTablet as string,
        heightMobile: node.data.props.heightMobile as string,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
    }))

    // Que items estan desplegados, para tintar solo esas cabeceras.
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

    // Items guardados antes de este cambio pueden no tener id/nombre.
    useEffect(() => {
        if (needsBackfill(images)) {
            setProp((props: Required<EditableImageCarouselProps>) => {
                props.images = backfillIdsAndNames(props.images, "Imagen")
            })
        }
    }, [images, setProp])

    const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
        useDragReorder((fromId, toId) => {
            setProp((props: Required<EditableImageCarouselProps>) => {
                props.images = reorderById(props.images, fromId, toId)
            })
        })

    const updateImage = (index: number, field: keyof ImageSlide, value: string) => {
        setProp((props: Required<EditableImageCarouselProps>) => {
            const newImages = [...props.images]
            newImages[index] = { ...newImages[index], [field]: value }
            props.images = newImages
        })
    }

    const addImage = () => {
        setProp((props: Required<EditableImageCarouselProps>) => {
            const nextNumber = props.images.length + 1
            props.images = [
                ...props.images,
                {
                    id: generateId(),
                    name: nextDefaultName(props.images, "Imagen"),
                    src: "/images/hero-banner.jpg",
                    alt: `Slide ${nextNumber}`,
                },
            ]
        })
    }

    const duplicateImage = (index: number) => {
        setProp((props: Required<EditableImageCarouselProps>) => {
            props.images = duplicateAt(props.images, index, "Imagen")
        })
    }

    const removeImage = (index: number) => {
        setProp((props: Required<EditableImageCarouselProps>) => {
            props.images = props.images.filter((_, i) => i !== index)
        })
    }

    return (
        <div className="flex flex-col">
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    {images.map((img, index) => {
                        const itemKey = img.id ?? String(index)
                        const isOpen = !!openItems[itemKey]
                        const displayName = img.name?.trim() || `Imagen ${index + 1}`

                        return (
                        <Collapsible
                            key={itemKey}
                            open={isOpen}
                            onOpenChange={(value) =>
                                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
                            }
                        >
                            <div
                                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(img.id)}`}
                                onDragOver={(e) => handleDragOver(e, img.id)}
                                onDrop={(e) => handleDrop(e, img.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                                        ocupan el alto completo de la fila y no quedan huecos
                                        muertos que desplieguen el item por un click fallido.
                                        La cabecera solo se tinta cuando el item esta desplegado. */}
                                    <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                                        <div className="flex items-stretch min-w-0 flex-1">
                                            <span
                                                draggable={!!img.id}
                                                onDragStart={(e) => {
                                                    e.stopPropagation()
                                                    if (img.id) handleDragStart(e, img.id)
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
                                                    duplicateImage(index)
                                                }}
                                                title="Duplicar"
                                                className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </div>

                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeImage(index)
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
                                                    Solo se utiliza para identificar la imagen dentro del editor.
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            value={img.name ?? ""}
                                            onChange={(e) => updateImage(index, "name", e.target.value)}
                                            placeholder={`Imagen ${index + 1}`}
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">URL Imagen</Label>
                                        <Input
                                            className="h-8 text-[12px] md:text-[12px]"
                                            value={img.src}
                                            onChange={(e) => updateImage(index, "src", e.target.value)}
                                            placeholder="URL imagen"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Ajuste visual (Object Fit)</Label>
                                        <Select
                                            value={img.fit || "cover"}
                                            onValueChange={(val) => updateImage(index, "fit", val)}
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
                    <Button variant="outline" size="sm" onClick={addImage} className="w-full mt-3 h-8 text-[12px]">
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Agregar imagen
                    </Button>
                </div>
            </SettingsSection>

            {/* El bloque no pinta texto propio hoy, pero la seccion se pone
                igual que en los demas carruseles: es la base que heredaria
                cualquier texto que llegue a llevar y mantiene el panel
                consistente. Sin valores guardados no emite ninguna regla. */}
            <TypographySection />

            <SpacingSection
                legacy={spacingLegacyOf({ heightDesktop, heightTablet, heightMobile })}
            />

            <SettingsSection title="Reproducción">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={autoplay}
                            onCheckedChange={(val) =>
                                setProp((props: Required<EditableImageCarouselProps>) => {
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
                                    setProp((props: Required<EditableImageCarouselProps>) => {
                                        props.interval = parseInt(e.target.value) || 3000
                                    })
                                }
                            />
                        </div>
                    )}
                </div>
            </SettingsSection>

            <SettingsSection title="Navegación">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={showArrows}
                            onCheckedChange={(val) =>
                                setProp((props: Required<EditableImageCarouselProps>) => {
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
                                setProp((props: Required<EditableImageCarouselProps>) => {
                                    props.showIndicators = Boolean(val)
                                })
                            }
                        />
                        <Label className="text-[11px] text-foreground/80">Indicadores</Label>
                    </div>
                </div>
            </SettingsSection>

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp((props: EditableImageCarouselProps) => (props.customClass = val))
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditableImageCarouselProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

EditableImageCarousel.craft = {
    displayName: "Carrusel de imágenes",
    props: {
        images: defaultImages,
        autoplay: false,
        interval: 3000,
        showArrows: true,
        showIndicators: false,
        heightDesktop: "",
        heightTablet: "",
        heightMobile: "",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableImageCarouselSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
