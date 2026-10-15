import { useId, useEffect, useState } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context"
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
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import {
    SpacingSection,
    uniformSpacing,
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

interface Testimonial {
    id?: string
    name?: string
    authorName?: string
    img: string
    rating: number
    comment: string
}

interface EditableTestimonialsProps {
    testimonials?: Testimonial[]
    columnsDesktop?: number
    columnsTablet?: number
    columnsMobile?: number
    gap?: number
    /**
     * @deprecated El relleno uniforme anterior. Se sigue leyendo porque lo traen los
     * bloques ya publicados; hoy el relleno va por lado y por modo (ver
     * SpacingSection) y este valor solo alimenta su `legacy`.
     */
    padding?: number
    background?: string
    borderStyle?: BorderStyle
    borderColor?: string
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
    /** Letra (Tipografía), medidas por modo (Tamaño y espaciado) y bordes: ver sus secciones. */
    [key: string]: unknown
}

// El relleno del formato anterior: un solo numero para los cuatro lados
// (`padding`, 16 por defecto). La seccion lo enseña y lo migra al primer cambio.
function spacingLegacyOf(props: { padding?: number }): SpacingLegacy {
    const padding = props.padding ?? 16
    return {
        padding: uniformSpacing(padding),
        paddingValueFor: () => padding,
    }
}

const defaultTestimonials: Testimonial[] = [
    {
        authorName: "Diego Osorio",
        img: "https://i.pravatar.cc/100?img=1",
        rating: 5,
        comment: "Excelente calidad y envío rápido. Superó mis expectativas y definitivamente volvería a comprar.",
    },
    {
        authorName: "María López",
        img: "https://i.pravatar.cc/100?img=2",
        rating: 4,
        comment: "Muy buena atención al cliente. El producto llegó en perfecto estado.",
    },
    {
        authorName: "Carlos Ramos",
        img: "https://i.pravatar.cc/100?img=3",
        rating: 5,
        comment: "Me encantó la experiencia de compra. Diseño moderno y muy fácil de usar.",
    },
]

// ── Helpers ────────────────────────────────────────────

const renderStars = (rating: number) => {
    const fullStars = "★".repeat(rating)
    const emptyStars = "☆".repeat(5 - rating)
    return fullStars + emptyStars
}

// ── Component ──────────────────────────────────────────

export function EditableTestimonials(props: EditableTestimonialsProps) {
    const {
    testimonials = defaultTestimonials,
    columnsDesktop = 3,
    columnsTablet = 2,
    columnsMobile = 1,
    gap = 32,
    background = "transparent",
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
    const columns = useResponsiveValue({ desktop: columnsDesktop, tablet: columnsTablet, mobile: columnsMobile })

    const id = useId()
    const gridClass = `editable-testimonials-${id.replace(/:/g, "")}`

    // El CSS escrito a mano en Avanzado, con su propia clase.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    // Bordes de la seccion "Bordes" del panel (nunca tuvo bordes antes: sin legacy).
    const borde = useBorderCss(props as Record<string, unknown>)

    // Medidas de la seccion "Tamaño y espaciado" (ancho, alto, relleno, margen).
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))

    // La letra va en la rejilla, no en cada tarjeta: es la base que heredan el
    // nombre y la reseña de todos los testimonios. Sin legacy: la tarjeta nunca
    // fijo alineacion ni familia propias, solo tamaños, y esos viajan ahora en
    // `em` dentro del JSX.
    const letra = useTypographyCss(props as Record<string, unknown>)

    return (
        <>
            <style>{columns !== null ? `
        .${gridClass} {
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
        }
      ` : `
        .${gridClass} {
          display: grid;
          grid-template-columns: repeat(${columnsMobile}, 1fr);
        }
        @media (min-width: 768px) {
          .${gridClass} {
            grid-template-columns: repeat(${columnsTablet}, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .${gridClass} {
            grid-template-columns: repeat(${columnsDesktop}, 1fr);
          }
        }
      `}</style>
            {visibilityJsx}
            {customCssTag}
            {borde.styleTag}
            {medidas.styleTag}
            {letra.styleTag}
            <SelectableNode
                className={`${gridClass} w-full transition-all duration-200 ${customCssClass} ${borde.className} ${medidas.className} ${letra.className} ${customClass} ${visClass}`}
                style={{
                    gap: `${gap}px`,
                    background: background,
                }}
            >
                {testimonials.map((test, index) => {
                    // Los testimonios ya publicados guardan el nombre del cliente en
                    // `name` (campo antiguo, hoy reservado para la etiqueta interna del
                    // patrón). El fallback evita perder ese nombre en la tienda.
                    const publicName = test.authorName ?? test.name
                    return (
                    <div
                        key={index}
                        className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col h-full"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src={test.img}
                                alt={publicName}
                                className="w-14 h-14 rounded-full object-cover"
                            />
                            <div>
                                {/* Sin color propio: era el mismo `text-foreground` del
                                    body, asi que heredarlo no cambia nada y deja que
                                    "Color de texto" del bloque llegue hasta aqui. El
                                    grosor si se queda: es lo que distingue al autor de
                                    su reseña, y la letra del bloque es la base sobre la
                                    que destaca, no algo que deba aplanarlo. */}
                                <p className="font-semibold">@{publicName}</p>
                                {/* Las estrellas miden en `em` para acompañar al tamaño
                                    del bloque. Conservan su amarillo y su `tracking`:
                                    son glifos de un icono, no texto que deba repintarse
                                    ni reespaciarse con la prosa. El alto de linea va
                                    fijo y sin unidad con el valor que daba `text-sm`,
                                    para que la fila del autor no cambie de alto. */}
                                <div className="flex text-yellow-500 text-[0.875em] leading-[1.4286] tracking-tighter">
                                    {renderStars(test.rating)}
                                </div>
                            </div>
                        </div>

                        {/* La reseña tambien mide en `em`, con la misma proporcion que
                            le daba `text-sm` (14/16). `leading-relaxed` ya era un alto
                            de linea sin unidad, asi que sigue acompañando al tamaño sin
                            tocarlo. El gris se queda: es su papel secundario frente al
                            nombre del autor. */}
                        <p className="text-muted-foreground text-[0.875em] leading-relaxed italic">
                            "{test.comment}"
                        </p>
                    </div>
                    )
                })}

                {enabled && testimonials.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-muted rounded-2xl">
                        <p className="text-muted-foreground">Agrega testimonios desde el panel lateral.</p>
                    </div>
                )}
            </SelectableNode>
        </>
    )
}

// ── Settings ───────────────────────────────────────────

const columnOptions = [
    { value: "1", label: "1 columna" },
    { value: "2", label: "2 columnas" },
    { value: "3", label: "3 columnas" },
    { value: "4", label: "4 columnas" },
]

function EditableTestimonialsSettings() {
    const {
        actions: { setProp },
        testimonials,
        columnsDesktop,
        columnsTablet,
        columnsMobile,
        gap,
        padding,
        background,
        customClass,
        customCss,
    } = useNode((node) => ({
        testimonials: node.data.props.testimonials as Testimonial[],
        columnsDesktop: node.data.props.columnsDesktop as number,
        columnsTablet: node.data.props.columnsTablet as number,
        columnsMobile: node.data.props.columnsMobile as number,
        gap: node.data.props.gap as number,
        padding: node.data.props.padding as number | undefined,
        background: node.data.props.background as string,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
    }))

    // Que items estan desplegados, para tintar solo esas cabeceras.
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

    const updateTestimonial = (index: number, field: keyof Testimonial, value: string | number) => {
        setProp((props: Required<EditableTestimonialsProps>) => {
            const newList = [...props.testimonials]
            newList[index] = { ...newList[index], [field]: value }
            props.testimonials = newList
        })
    }

    // Testimonios guardados antes de este cambio pueden no tener id/nombre.
    useEffect(() => {
        if (needsBackfill(testimonials)) {
            setProp((props: Required<EditableTestimonialsProps>) => {
                props.testimonials = backfillIdsAndNames(props.testimonials, "Testimonio")
            })
        }
    }, [testimonials, setProp])

    const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
        useDragReorder((fromId, toId) => {
            setProp((props: Required<EditableTestimonialsProps>) => {
                props.testimonials = reorderById(props.testimonials, fromId, toId)
            })
        })

    const addTestimonial = () => {
        setProp((props: Required<EditableTestimonialsProps>) => {
            props.testimonials = [
                ...props.testimonials,
                {
                    id: generateId(),
                    name: nextDefaultName(props.testimonials, "Testimonio"),
                    authorName: "Nuevo Cliente",
                    img: "https://i.pravatar.cc/100?img=10",
                    rating: 5,
                    comment: "Escribe aquí la reseña..."
                }
            ]
        })
    }

    const duplicateTestimonial = (index: number) => {
        setProp((props: Required<EditableTestimonialsProps>) => {
            props.testimonials = duplicateAt(props.testimonials, index, "Testimonio")
        })
    }

    const removeTestimonial = (index: number) => {
        setProp((props: Required<EditableTestimonialsProps>) => {
            props.testimonials = props.testimonials.filter((_, i) => i !== index)
        })
    }

    return (
        <div className="flex flex-col">
            {/* ── Testimonials Management ── */}
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    {testimonials.map((test, index) => {
                        const itemKey = test.id ?? String(index)
                        const isOpen = !!openItems[itemKey]
                        const displayName = test.name?.trim() || `Testimonio ${index + 1}`

                        return (
                        <Collapsible
                            key={itemKey}
                            open={isOpen}
                            onOpenChange={(value) =>
                                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
                            }
                        >
                            <div
                                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(test.id)}`}
                                onDragOver={(e) => handleDragOver(e, test.id)}
                                onDrop={(e) => handleDrop(e, test.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                                        ocupan el alto completo de la fila y no quedan huecos
                                        muertos que desplieguen el item por un click fallido.
                                        La cabecera solo se tinta cuando el item esta desplegado. */}
                                    <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                                        <div className="flex items-stretch min-w-0 flex-1">
                                            <span
                                                draggable={!!test.id}
                                                onDragStart={(e) => {
                                                    e.stopPropagation()
                                                    if (test.id) handleDragStart(e, test.id)
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
                                                    duplicateTestimonial(index)
                                                }}
                                                title="Duplicar"
                                                className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </div>

                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeTestimonial(index)
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
                                                    Solo se utiliza para identificar el testimonio dentro del editor.
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            value={test.name ?? ""}
                                            onChange={(e) => updateTestimonial(index, "name", e.target.value)}
                                            placeholder={`Testimonio ${index + 1}`}
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Nombre del cliente</Label>
                                        <Input
                                            value={test.authorName ?? ""}
                                            onChange={(e) => updateTestimonial(index, "authorName", e.target.value)}
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Imagen (URL)</Label>
                                        <Input
                                            value={test.img}
                                            onChange={(e) => updateTestimonial(index, "img", e.target.value)}
                                            placeholder="https://..."
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Calificación</Label>
                                        <Select
                                            value={String(test.rating)}
                                            onValueChange={(val) => updateTestimonial(index, "rating", parseInt(val))}
                                        >
                                            <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <SelectItem key={val} value={String(val)} className="text-[12px]">{val} estrellas</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Comentario</Label>
                                        <Input
                                            value={test.comment}
                                            onChange={(e) => updateTestimonial(index, "comment", e.target.value)}
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                        )
                    })}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={addTestimonial}
                    className="w-full mt-3 h-8 text-[12px]"
                >
                    <Plus className="h-3 w-3 mr-2" />
                    Agregar Testimonio
                </Button>
            </SettingsSection>

            {/* La letra de la rejilla, que heredan el nombre y la reseña de cada
                testimonio. Sin "Alto de línea": los textos de la tarjeta lo llevan
                proporcional a su propio tamaño (`leading-relaxed` en la reseña, el de
                `text-sm` en las estrellas), y un valor unico del bloque solo podria
                llegar a ellos borrando esa proporcion, con lo que las tarjetas ya
                publicadas cambiarian de alto. */}
            <TypographySection fields={{ lineHeight: false }} />

            {/* ── Grid Settings ── */}
            <SettingsSection title="Distribución">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Escritorio (≥1024px)</Label>
                        <Select
                            value={String(columnsDesktop)}
                            onValueChange={(val) => setProp((p: any) => (p.columnsDesktop = parseInt(val)))}
                        >
                            <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {columnOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Tableta (≥768px)</Label>
                        <Select
                            value={String(columnsTablet)}
                            onValueChange={(val) => setProp((p: any) => (p.columnsTablet = parseInt(val)))}
                        >
                            <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {columnOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Celular (&lt;768px)</Label>
                        <Select
                            value={String(columnsMobile)}
                            onValueChange={(val) => setProp((p: any) => (p.columnsMobile = parseInt(val)))}
                        >
                            <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {columnOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-[12px]">{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </SettingsSection>

            {/* ── Style Settings ── */}
            <SettingsSection title="Estilos">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Espaciado (gap)</Label>
                        <Input
                            type="number"
                            value={gap}
                            onChange={(e) => setProp((p: any) => (p.gap = parseInt(e.target.value) || 0))}
                            className="h-8 text-[12px] md:text-[12px]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Fondo</Label>
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={background}
                                onChange={(val) => setProp((p: any) => (p.background = val))}
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf({ padding })} />

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp((props: EditableTestimonialsProps) => (props.customClass = val))
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditableTestimonialsProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

EditableTestimonials.craft = {
    displayName: "Testimonios",
    props: {
        testimonials: defaultTestimonials,
        columnsDesktop: 3,
        columnsTablet: 2,
        columnsMobile: 1,
        gap: 32,
        padding: 16,
        background: "transparent",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableTestimonialsSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
