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
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import {
    SpacingSection,
    useSpacingCss,
    uniformSpacing,
    type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import {
    TypographySection,
    useTypographyCss,
    type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// ── Types ──────────────────────────────────────────────

interface Benefit {
    id?: string
    name?: string
    img: string
    title: string
    description: string
}

interface EditableBenefitsProps {
    benefits?: Benefit[]
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
    /** Letra (Tipografía), medidas (Tamaño y espaciado) y bordes: ver sus secciones. */
    [key: string]: unknown
}

// El relleno unico de antes (16 por defecto), para que la seccion lo enseñe y
// lo siga pintando hasta que se toque y migre a los cuatro lados por modo.
function spacingLegacyOf(props: EditableBenefitsProps): SpacingLegacy {
    const padding = props.padding ?? 16
    return { padding: uniformSpacing(padding), paddingValueFor: () => padding }
}

// La unica letra que el bloque aplicaba: las tarjetas venian centradas con una
// clase fija. Se declara aqui y se quita de la tarjeta, porque una alineacion
// escrita a fuego en el JSX le gana siempre a la que herede de la rejilla y
// dejaria muerto el campo "Alineación". No depende de props: no hay nada
// guardado que migrar, solo el centrado con el que nacieron las publicadas.
const typographyLegacy: TypographyLegacy = { textAlign: "center" }

const defaultBenefit: Benefit = {
    img: "/images/benefits/quality.svg",
    title: "Calidad Garantizada",
    description: "Productos seleccionados con altos estándares de calidad.",
}

const defaultBenefits: Benefit[] = [
    { ...defaultBenefit },
    {
        img: "/images/benefits/shipping.svg",
        title: "Envío Rápido",
        description: "Recibe tus pedidos en la puerta de tu casa en tiempo récord."
    },
    {
        img: "/images/benefits/support.svg",
        title: "Soporte 24/7",
        description: "Nuestro equipo está disponible para ayudarte en cualquier momento."
    },
]

// ── Component ──────────────────────────────────────────

export function EditableBenefits(props: EditableBenefitsProps) {
    const {
    benefits = defaultBenefits,
    columnsDesktop = 3,
    columnsTablet = 2,
    columnsMobile = 1,
    gap = 16,
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
    const gridClass = `editable-benefits-${id.replace(/:/g, "")}`

    // El CSS escrito a mano en Avanzado. Lleva su propia clase, aparte de la de
    // la rejilla, para que el usuario pueda pisarla si quiere.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    // El borde de la rejilla entera, de la seccion "Bordes" del panel.
    const borde = useBorderCss(props as Record<string, unknown>)
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))

    // La letra va en la rejilla, no en cada tarjeta: es la base que heredan el
    // titulo y la descripcion de todos los beneficios, presentes y futuros.
    const letra = useTypographyCss(props as Record<string, unknown>, typographyLegacy)

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
                className={`${gridClass} ${borde.className} ${medidas.className} ${letra.className} w-full transition-all duration-200 ${visClass} ${customCssClass} ${customClass}`}
                style={{
                    gap: `${gap}px`,
                    background: background,
                }}
            >
                {/* Los textos de la tarjeta miden su letra en `em`: asi la tipografia
                    de la rejilla es la base y el titulo sigue destacando sobre la
                    descripcion en la misma proporcion de siempre (18/16 y 14/16), en
                    vez de aplanarse los dos al tamaño del bloque. El alto de linea va
                    sin unidad por el mismo motivo: acompaña al tamaño de cada texto.
                    Los valores reproducen exactamente lo que daban `text-lg` y
                    `text-sm`, para que una pagina ya publicada no se mueva.
                    La tarjeta ya no centra ni colorea: el centrado viaja en la
                    alineacion de la rejilla (ver `typographyLegacy`) y el color del
                    titulo se hereda —era el mismo `text-foreground` del body—, que es
                    lo que permite que "Alineación" y "Color de texto" hagan algo. El
                    gris de la descripcion si se queda: es su papel secundario, no una
                    tipografia que el bloque deba pisar. */}
                {benefits.map((benefit, index) => (
                    <div
                        key={index}
                        className="flex flex-col p-6 rounded-xl border bg-card hover:shadow-md transition"
                    >
                        <img
                            src={benefit.img}
                            alt={benefit.title}
                            className="w-14 h-14 mb-4 mx-auto object-contain"
                        />
                        <h3 className="text-[1.125em] leading-[1.5556] font-semibold">
                            {benefit.title}
                        </h3>
                        <p className="text-[0.875em] leading-[1.4286] text-muted-foreground mt-2">
                            {benefit.description}
                        </p>
                    </div>
                ))}

                {enabled && benefits.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-muted rounded-xl">
                        <p className="text-muted-foreground">Agrega beneficios desde el panel lateral.</p>
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
    { value: "5", label: "5 columnas" },
    { value: "6", label: "6 columnas" },
]

function EditableBenefitsSettings() {
    const {
        actions: { setProp },
        benefits,
        columnsDesktop,
        columnsTablet,
        columnsMobile,
        gap,
        padding,
        background,
        customClass,
        customCss,
    } = useNode((node) => ({
        benefits: node.data.props.benefits as Benefit[],
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

    const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
        setProp((props: Required<EditableBenefitsProps>) => {
            const newBenefits = [...props.benefits]
            newBenefits[index] = { ...newBenefits[index], [field]: value }
            props.benefits = newBenefits
        })
    }

    // Beneficios guardados antes de este cambio pueden no tener id/nombre.
    useEffect(() => {
        if (needsBackfill(benefits)) {
            setProp((props: Required<EditableBenefitsProps>) => {
                props.benefits = backfillIdsAndNames(props.benefits, "Beneficio")
            })
        }
    }, [benefits, setProp])

    const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
        useDragReorder((fromId, toId) => {
            setProp((props: Required<EditableBenefitsProps>) => {
                props.benefits = reorderById(props.benefits, fromId, toId)
            })
        })

    const addBenefit = () => {
        setProp((props: Required<EditableBenefitsProps>) => {
            props.benefits = [
                ...props.benefits,
                {
                    ...defaultBenefit,
                    id: generateId(),
                    name: nextDefaultName(props.benefits, "Beneficio"),
                    title: "Nuevo Beneficio",
                },
            ]
        })
    }

    const duplicateBenefit = (index: number) => {
        setProp((props: Required<EditableBenefitsProps>) => {
            props.benefits = duplicateAt(props.benefits, index, "Beneficio")
        })
    }

    const removeBenefit = (index: number) => {
        setProp((props: Required<EditableBenefitsProps>) => {
            props.benefits = props.benefits.filter((_, i) => i !== index)
        })
    }

    return (
        <div className="flex flex-col">
            {/* ── Benefits Management ── */}
            {/* Sin borde superior: la cabecera del panel ya cierra por arriba. */}
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    {benefits.map((benefit, index) => {
                        const itemKey = benefit.id ?? String(index)
                        const isOpen = !!openItems[itemKey]
                        const displayName = benefit.name?.trim() || `Beneficio ${index + 1}`

                        return (
                        <Collapsible
                            key={itemKey}
                            open={isOpen}
                            onOpenChange={(value) =>
                                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
                            }
                        >
                            <div
                                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(benefit.id)}`}
                                onDragOver={(e) => handleDragOver(e, benefit.id)}
                                onDrop={(e) => handleDrop(e, benefit.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                                        ocupan el alto completo de la fila y no quedan huecos
                                        muertos que desplieguen el item por un click fallido.
                                        La cabecera solo se tinta cuando el item esta desplegado. */}
                                    <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                                        <div className="flex items-stretch min-w-0 flex-1">
                                            <span
                                                draggable={!!benefit.id}
                                                onDragStart={(e) => {
                                                    e.stopPropagation()
                                                    if (benefit.id) handleDragStart(e, benefit.id)
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
                                                    duplicateBenefit(index)
                                                }}
                                                title="Duplicar"
                                                className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </div>

                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeBenefit(index)
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
                                                    Solo se utiliza para identificar el beneficio dentro del editor.
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            value={benefit.name ?? ""}
                                            onChange={(e) => updateBenefit(index, "name", e.target.value)}
                                            placeholder={`Beneficio ${index + 1}`}
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Imagen (URL)</Label>
                                        <Input
                                            value={benefit.img}
                                            onChange={(e) => updateBenefit(index, "img", e.target.value)}
                                            placeholder="/images/benefit.svg"
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Título</Label>
                                        <Input
                                            value={benefit.title}
                                            onChange={(e) => updateBenefit(index, "title", e.target.value)}
                                            placeholder="Calidad..."
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Descripción</Label>
                                        <Input
                                            value={benefit.description}
                                            onChange={(e) => updateBenefit(index, "description", e.target.value)}
                                            placeholder="Escribe algo corto..."
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
                    onClick={addBenefit}
                    className="w-full mt-3 h-8 text-[12px]"
                >
                    <Plus className="h-3 w-3 mr-2" />
                    Agregar Beneficio
                </Button>
            </SettingsSection>

            {/* La letra de la rejilla, que heredan el titulo y la descripcion de cada
                beneficio. Sin "Alto de línea": los dos textos de la tarjeta lo llevan
                proporcional a su propio tamaño (es lo que les daban `text-lg` y
                `text-sm`), y un valor unico del bloque solo podria llegar a ellos
                borrando esa proporcion, con lo que las tarjetas ya publicadas
                cambiarian de alto. */}
            <TypographySection legacy={typographyLegacy} fields={{ lineHeight: false }} />

            {/* ── Grid Settings ── */}
            <SettingsSection title="Distribución">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Escritorio (≥1024px)</Label>
                        <Select
                            value={String(columnsDesktop)}
                            onValueChange={(val) => setProp((props: any) => (props.columnsDesktop = parseInt(val)))}
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
                            onValueChange={(val) => setProp((props: any) => (props.columnsTablet = parseInt(val)))}
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
                            onValueChange={(val) => setProp((props: any) => (props.columnsMobile = parseInt(val)))}
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
                            onChange={(e) => setProp((props: any) => (props.gap = parseInt(e.target.value) || 0))}
                            className="h-8 text-[12px] md:text-[12px]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Fondo</Label>
                        {/* ColorField no acepta className: el tamaño se le pasa
                            desde fuera, sin tocar el componente de ui/. */}
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={background}
                                onChange={(val) => setProp((props: any) => (props.background = val))}
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
                    setProp((props: EditableBenefitsProps) => (props.customClass = val))
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditableBenefitsProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

EditableBenefits.craft = {
    displayName: "Beneficios",
    props: {
        benefits: defaultBenefits,
        columnsDesktop: 3,
        columnsTablet: 2,
        columnsMobile: 1,
        gap: 16,
        padding: 16,
        background: "transparent",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableBenefitsSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
