import { useId, useEffect, useState } from "react"
import { useEditor, useNode } from "@craftjs/core"
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
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
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

interface FAQItem {
    id?: string
    name?: string
    question: string
    answer: string
}

interface EditableFAQProps {
    faqs?: FAQItem[]
    background?: string
    borderStyle?: BorderStyle
    borderColor?: string
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
    /** Medidas por modo (Tamaño y espaciado) y bordes: ver spacing-section / border-section. */
    [key: string]: unknown
}

// El relleno que el bloque siempre pinto fijo —24px arriba y abajo, 16px a
// los lados— sin que el usuario pudiera tocarlo. Como legacy, la seccion lo
// enseña y lo migra al primer cambio.
function spacingLegacyOf(): SpacingLegacy {
    return {
        padding: {
            sides: { Top: 24, Right: 16, Bottom: 24, Left: 16 },
            unit: "px",
            custom: "",
        },
        paddingValueFor: (side) => (side === "Top" || side === "Bottom" ? 24 : 16),
    }
}

const defaultFAQs: FAQItem[] = [
    {
        question: "¿Cuánto tiempo tarda el envío?",
        answer: "Nuestros envíos tardan entre 2 a 5 días hábiles dependiendo de tu ubicación.",
    },
    {
        question: "¿Tienen política de devoluciones?",
        answer: "Sí, aceptamos devoluciones dentro de los primeros 30 días después de recibir tu compra.",
    },
    {
        question: "¿Cuáles son los métodos de pago?",
        answer: "Aceptamos todas las tarjetas de crédito, débito y transferencias bancarias.",
    },
]

// ── Component ──────────────────────────────────────────

export function EditableFAQ(props: EditableFAQProps) {
    const {
    faqs = defaultFAQs,
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

    // El CSS escrito a mano en Avanzado. Lleva su propia clase para que el
    // usuario pueda apuntar a este componente en concreto.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    // Bordes de la seccion "Bordes" del panel (nunca tuvo bordes antes: sin legacy).
    const borde = useBorderCss(props as Record<string, unknown>)

    // Medidas de la seccion "Tamaño y espaciado" (ancho, alto, relleno, margen).
    const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf())

    // Letra de la seccion "Tipografía". Va en el contenedor raiz y ademas en la
    // respuesta, que es el lado del acordeon que no la heredaria (ver abajo).
    // Sin legacy: el bloque nunca guardo nada de letra, y lo que el acordeon
    // trae escrito a fuego no es un valor suyo que haya que migrar —declararlo
    // como legacy lo emitiria en el contenedor y le cambiaria el tamaño a la
    // pregunta, que hoy hereda el del sitio.
    const letra = useTypographyCss(props as Record<string, unknown>)

    const id = useId()
    const componentId = id.replace(/:/g, "")

    return (
        <>
        {visibilityJsx}
        {customCssTag}
        {borde.styleTag}
        {medidas.styleTag}
        {letra.styleTag}
        <SelectableNode
            className={`w-full transition-all duration-200 ${visClass} ${customCssClass} ${borde.className} ${medidas.className} ${letra.className} ${customClass}`}
            style={{
                background: background,
            }}
        >
            <Accordion
                type="single"
                collapsible
                defaultValue="faq-0"
                className="w-full"
            >
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                        {/* La pregunta no lleva la clase de la letra: la hereda
                            del contenedor —un <button> hereda fuente, tamaño,
                            alto de linea y color por el preflight de Tailwind—
                            y asi conserva lo suyo, que es lo que la distingue
                            de la respuesta. `font-semibold` la mantiene mas
                            gruesa cualquiera que sea el grosor del bloque, y
                            `text-left` es lo unico que impide que el navegador
                            centre el texto del boton. */}
                        <AccordionTrigger className="text-left font-semibold">
                            {faq.question}
                        </AccordionTrigger>
                        {/* La respuesta si la lleva encima: el acordeon
                            compartido le fija un `text-sm` en su propio
                            envoltorio, y heredar nunca le gana a una clase del
                            elemento, asi que sin esto el tamaño y el alto de
                            linea del panel no llegarian a la respuesta.
                            Mientras nadie los toque no se emite regla y se
                            sigue viendo como siempre. */}
                        <AccordionContent className={`text-muted-foreground leading-relaxed ${letra.className}`}>
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {enabled && faqs.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-muted rounded-xl">
                    <p className="text-muted-foreground">Agrega preguntas desde el panel lateral.</p>
                </div>
            )}
        </SelectableNode>
        </>
    )
}

// ── Settings ───────────────────────────────────────────

function EditableFAQSettings() {
    const {
        actions: { setProp },
        faqs,
        background,
        customClass,
        customCss,
    } = useNode((node) => ({
        faqs: node.data.props.faqs as FAQItem[],
        background: node.data.props.background as string,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
    }))

    // Que items estan desplegados, para tintar solo esas cabeceras.
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

    const updateFAQ = (index: number, field: keyof FAQItem, value: string) => {
        setProp((props: Required<EditableFAQProps>) => {
            const newList = [...props.faqs]
            newList[index] = { ...newList[index], [field]: value }
            props.faqs = newList
        })
    }

    // Preguntas guardadas antes de este cambio pueden no tener id/nombre.
    useEffect(() => {
        if (needsBackfill(faqs)) {
            setProp((props: Required<EditableFAQProps>) => {
                props.faqs = backfillIdsAndNames(props.faqs, "Pregunta")
            })
        }
    }, [faqs, setProp])

    const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
        useDragReorder((fromId, toId) => {
            setProp((props: Required<EditableFAQProps>) => {
                props.faqs = reorderById(props.faqs, fromId, toId)
            })
        })

    const addFAQ = () => {
        setProp((props: Required<EditableFAQProps>) => {
            props.faqs = [
                ...props.faqs,
                {
                    id: generateId(),
                    name: nextDefaultName(props.faqs, "Pregunta"),
                    question: "Nueva Pregunta",
                    answer: "Escribe aquí la respuesta...",
                },
            ]
        })
    }

    const duplicateFAQ = (index: number) => {
        setProp((props: Required<EditableFAQProps>) => {
            props.faqs = duplicateAt(props.faqs, index, "Pregunta")
        })
    }

    const removeFAQ = (index: number) => {
        setProp((props: Required<EditableFAQProps>) => {
            props.faqs = props.faqs.filter((_, i) => i !== index)
        })
    }

    return (
        <div className="flex flex-col">
            {/* ── FAQ Management ── */}
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    {faqs.map((faq, index) => {
                        const itemKey = faq.id ?? String(index)
                        const isOpen = !!openItems[itemKey]
                        const displayName = faq.name?.trim() || `Pregunta ${index + 1}`

                        return (
                        <Collapsible
                            key={itemKey}
                            open={isOpen}
                            onOpenChange={(value) =>
                                setOpenItems((prev) => ({ ...prev, [itemKey]: value }))
                            }
                        >
                            <div
                                className={`bg-card border rounded-lg overflow-hidden ${itemDragClass(faq.id)}`}
                                onDragOver={(e) => handleDragOver(e, faq.id)}
                                onDrop={(e) => handleDrop(e, faq.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    {/* Sin padding propio: cada parte pone su py-2.5, asi todas
                                        ocupan el alto completo de la fila y no quedan huecos
                                        muertos que desplieguen el item por un click fallido.
                                        La cabecera solo se tinta cuando el item esta desplegado. */}
                                    <div className={`flex items-stretch justify-between w-full text-left select-none transition-colors ${isOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                                        <div className="flex items-stretch min-w-0 flex-1">
                                            <span
                                                draggable={!!faq.id}
                                                onDragStart={(e) => {
                                                    e.stopPropagation()
                                                    if (faq.id) handleDragStart(e, faq.id)
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
                                                    duplicateFAQ(index)
                                                }}
                                                title="Duplicar"
                                                className="flex items-center px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </div>

                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeFAQ(index)
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
                                                    Solo se utiliza para identificar la pregunta dentro del editor.
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            value={faq.name ?? ""}
                                            onChange={(e) => updateFAQ(index, "name", e.target.value)}
                                            placeholder={`Pregunta ${index + 1}`}
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Pregunta</Label>
                                        <Input
                                            value={faq.question}
                                            onChange={(e) => updateFAQ(index, "question", e.target.value)}
                                            className="h-8 text-[12px] md:text-[12px]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] font-bold text-foreground/80">Respuesta</Label>
                                        <Input
                                            value={faq.answer}
                                            onChange={(e) => updateFAQ(index, "answer", e.target.value)}
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
                    onClick={addFAQ}
                    className="w-full mt-3 h-8 text-[12px]"
                >
                    <Plus className="h-3 w-3 mr-2" />
                    Agregar Pregunta
                </Button>
            </SettingsSection>

            {/* ── Tipografía ── */}
            <TypographySection />

            {/* ── Style Settings ── */}
            <SettingsSection title="Estilos">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Fondo</Label>
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={background}
                                onChange={(val) =>
                                    setProp((props: any) => (props.background = val))
                                }
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf()} />

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp((props: EditableFAQProps) => (props.customClass = val))
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditableFAQProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

EditableFAQ.craft = {
    displayName: "Preguntas frecuentes",
    props: {
        faqs: defaultFAQs,
        background: "transparent",
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditableFAQSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
