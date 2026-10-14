import { useId, useRef, useMemo } from "react"
import Link from "@/modules/ecommerce/editor/tienda/next-link"
import { useEditor, useNode } from "@craftjs/core"
import { cn } from "@/shared/utils/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { useDragReorder } from "./drag-reorder"
import AutoScroll from "embla-carousel-auto-scroll"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"

import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { type FontFamily } from "@/modules/ecommerce/editor/lib/font-families"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss, type SpacingLegacy } from "@/modules/ecommerce/editor/components/spacing-section"
import {
    TypographySection,
    useTypographyCss,
    type TypographyLegacy,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"

interface EditablePromotionalTextProps {
    // Las medidas por modo de pantalla (SpacingSection) y los bordes
    // (BorderSection) escriben sus props aqui sin declararlas una a una.
    [key: string]: unknown
    texts?: string[]
    borderStyle?: BorderStyle
    borderColor?: string
    backgroundColor?: string
    textColor?: string
    link?: string
    speed?: number
    repetitions?: number
    /**
     * @deprecated El tamaño lo guarda ahora `size{Modo}` (ver TypographySection).
     * Se sigue leyendo, por `legacy`, para que las paginas ya publicadas —que no
     * traen las props nuevas— se sigan viendo igual.
     */
    fontSize?: number
    fontFamily?: FontFamily
    paddingX?: number
    /**
     * @deprecated El relleno vertical anterior, igual arriba y abajo. Se
     * sigue leyendo porque lo traen las cintas ya publicadas y solo
     * alimenta el `legacy` de SpacingSection. (`paddingX` no: ese sigue
     * vivo, es la separacion entre mensajes.)
     */
    paddingY?: number
    customClass?: string
    /** CSS escrito a mano. Ver AdvancedSection. */
    customCss?: string
    hiddenOnDesktop?: boolean
    hiddenOnTablet?: boolean
    hiddenOnMobile?: boolean
}

// Las medidas del formato anterior, para que la seccion las enseñe y las migre
// al primer cambio, y para que el render las siga pintando mientras tanto.
//
// Solo migra el relleno vertical: `paddingY` iba en cada mensaje, pero como
// todos lo llevan igual equivale al relleno de arriba y abajo de la cinta.
// `paddingX` no es relleno de la cinta sino la separacion entre mensajes, y se
// queda en los <span> con su propio campo.
function spacingLegacyOf(props: { paddingY?: number }): SpacingLegacy {
    const paddingY = props.paddingY ?? 12
    return {
        padding: {
            sides: { Top: paddingY, Bottom: paddingY },
            unit: "px",
            custom: "",
        },
        paddingValueFor: (side) => (side === "Top" || side === "Bottom" ? paddingY : undefined),
    }
}

// La letra del formato anterior, por el mismo motivo que las medidas: la cinta
// la pintaba en linea en cada mensaje y hay paginas publicadas que solo traen
// estos nombres. Los valores por defecto son los que tenia la firma del
// componente, para que una pagina sin nada guardado no cambie de aspecto.
//
// `paddingX` no entra aqui: es la separacion entre mensajes, no letra, y no
// tiene nada que ver con el espaciado entre letras de la seccion.
function typographyLegacyOf(props: {
    fontSize?: number
    fontFamily?: FontFamily
    textColor?: string
}): TypographyLegacy {
    return {
        size: { desktop: { value: props.fontSize ?? 14, unit: "px", custom: "" } },
        fontFamily: props.fontFamily ?? "sans",
        textColor: props.textColor ?? "#ffffff",
    }
}

export function EditablePromotionalText({
    texts = ["Texto promocional", "Envío gratis", "Devoluciones sin costo"],
    backgroundColor = "#000000",
    textColor = "#ffffff",
    link = "",
    speed = 1.2,
    repetitions = 9,
    fontSize = 14,
    fontFamily = "sans",
    paddingX = 32,
    paddingY = 12,
    customClass = "",
    customCss,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
}: EditablePromotionalTextProps) {
    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }))
    const { bag } = useNode((node) => ({
        bag: node.data.props as Record<string, unknown>,
    }))

    const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })

    // El CSS escrito a mano en Avanzado, con su propia clase.
    const { className: customCssClass, customCssTag } = useCustomCss(customCss)

    // Bordes de la seccion general del panel (ver BorderSection). Van en el
    // contenedor de la cinta, el que lleva el fondo, no en los textos que
    // se desplazan.
    const borde = useBorderCss(bag)

    // Medidas de la seccion general del panel (ver SpacingSection), en el
    // mismo contenedor que los bordes.
    const medidas = useSpacingCss(bag, spacingLegacyOf({ paddingY }))

    // Letra de la seccion general del panel (ver TypographySection). Va en el
    // contenedor de la cinta y los mensajes la heredan: escribirla en cada
    // <span> obligaria a regenerarlos por cada cambio y un estilo en linea le
    // ganaria al <style> de la seccion.
    const letra = useTypographyCss(bag, typographyLegacyOf({ fontSize, fontFamily, textColor }))

    const id = useId()

    const isExternal = link.startsWith("http")
    const isScrollId = link.startsWith("#")
    const isInternal = !isExternal && !isScrollId
    const hasLink = !!link

    const autoScroll = useRef(
        AutoScroll({
            speed: speed,
            startDelay: 0,
            stopOnInteraction: false,
            stopOnMouseEnter: false,
            playOnInit: true,
        })
    )

    const normalizedTexts = useMemo(
        () => (Array.isArray(texts) ? texts : [texts]),
        [texts]
    )

    // ✨ Generación de contenido repetido para efecto infinito
    const repeatedContent = useMemo(() => {
        if (!normalizedTexts.length) return null

        return Array.from({ length: repetitions }).flatMap((_, repetitionIndex) =>
            normalizedTexts.map((text, textIndex) => (
                <span
                    key={`${repetitionIndex}-${textIndex}`}
                    className="whitespace-nowrap inline-block"
                    // Solo la separacion entre mensajes: la letra la hereda del
                    // contenedor. Al no depender ya de la letra, cambiarla no
                    // rehace estos nodos; el bucle se vuelve a medir igual
                    // porque embla observa el tamaño de sus diapositivas y se
                    // reinicia cuando el texto cambia de ancho.
                    style={{ paddingLeft: paddingX, paddingRight: paddingX }}
                >
                    {text}
                </span>
            ))
        )
    }, [normalizedTexts, repetitions, paddingX])

    const carouselContent = (
        <div
            className={cn("w-full overflow-hidden", borde.className, medidas.className, letra.className)}
            // El color del texto salio de aqui: ahora lo escribe la seccion de
            // tipografia, y un estilo en linea le ganaria.
            style={{ backgroundColor }}
        >
            <Carousel
                opts={{
                    loop: true,
                    watchDrag: false, // 🔒 Sin interacción de drag en el carrusel
                    skipSnaps: true,
                }}
                plugins={[autoScroll.current]}
                className="w-full pointer-events-none" // 🔒 Bloquea interacción total con el carrusel
            >
                <CarouselContent className="flex">
                    {/* Bloque A */}
                    <CarouselItem className="basis-auto flex-none pl-0">
                        <div className="flex whitespace-nowrap">{repeatedContent}</div>
                    </CarouselItem>

                    {/* Bloque B (duplicado para loop visual) */}
                    <CarouselItem className="basis-auto flex-none pl-0">
                        <div className="flex whitespace-nowrap">{repeatedContent}</div>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div>
    )

    return (
        <>
        {visibilityJsx}
        {customCssTag}
        {borde.styleTag}
        {medidas.styleTag}
        {letra.styleTag}
        <SelectableNode
            className={cn(
                "w-full group",
                customCssClass,
                customClass,
                visClass,
                // Tenia una capa transparente por encima para bloquear la
                // interaccion; dejo de hacer falta cuando el contenido paso a no
                // recibir el puntero. De ella solo queda el cursor, que ahora lo
                // pone el contenedor.
                enabled && "cursor-move",
            )}
            // Se elevaba al seleccionarlo para que su marca no quedase tapada
            // por los hermanos; el ternario viejo lo hacia con un z-10 suelto.
            activeClassName="z-10"
        >
            {hasLink ? (
                isInternal ? (
                    <Link
                        href={link}
                        onClick={(e) => {
                            if (enabled) e.preventDefault()
                        }}
                        className="block w-full h-full"
                    >
                        {carouselContent}
                    </Link>
                ) : (
                    <a
                        href={link}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        onClick={(e) => {
                            if (enabled) e.preventDefault()
                        }}
                        className="block w-full h-full"
                    >
                        {carouselContent}
                    </a>
                )
            ) : (
                carouselContent
            )}
        </SelectableNode>
        </>
    )
}

function EditablePromotionalTextSettings() {
    const {
        actions: { setProp },
        texts,
        backgroundColor,
        textColor,
        link,
        speed,
        repetitions,
        fontSize,
        fontFamily,
        paddingX,
        paddingY,
        customClass,
        customCss,
    } = useNode((node) => ({
        texts: node.data.props.texts,
        backgroundColor: node.data.props.backgroundColor,
        textColor: node.data.props.textColor,
        link: node.data.props.link,
        speed: node.data.props.speed,
        repetitions: node.data.props.repetitions,
        fontSize: node.data.props.fontSize,
        fontFamily: node.data.props.fontFamily,
        paddingX: node.data.props.paddingX,
        paddingY: node.data.props.paddingY,
        customClass: node.data.props.customClass as string | undefined,
        customCss: node.data.props.customCss as string | undefined,
    }))

    // 🛠️ Funciones para gestionar lista de textos
    const addText = () => {
        setProp((props: EditablePromotionalTextProps) => {
            const currentTexts = Array.isArray(props.texts) ? props.texts : [props.texts || ""]
            props.texts = [...currentTexts, "Nuevo texto"]
        })
    }

    const updateText = (index: number, value: string) => {
        setProp((props: EditablePromotionalTextProps) => {
            const currentTexts = [...(Array.isArray(props.texts) ? props.texts : [])]
            currentTexts[index] = value
            props.texts = currentTexts
        })
    }

    // Los mensajes son strings sin id: se arrastra usando el indice como id
    // (estable durante un mismo gesto de drag).
    const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
        useDragReorder((fromId, toId) => {
            setProp((props: EditablePromotionalTextProps) => {
                const currentTexts = [...(Array.isArray(props.texts) ? props.texts : [])]
                const from = parseInt(fromId)
                const to = parseInt(toId)
                if (Number.isNaN(from) || Number.isNaN(to)) return
                const [moved] = currentTexts.splice(from, 1)
                currentTexts.splice(to, 0, moved)
                props.texts = currentTexts
            })
        })

    const removeText = (index: number) => {
        setProp((props: EditablePromotionalTextProps) => {
            const currentTexts = [...(Array.isArray(props.texts) ? props.texts : [])]
            if (currentTexts.length > 1) {
                props.texts = currentTexts.filter((_, i) => i !== index)
            }
        })
    }

    return (
        <div className="flex flex-col">
            <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Mensajes</Label>
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                            {Array.isArray(texts) && texts.map((text: string, index: number) => (
                                <div
                                    key={index}
                                    className={`flex gap-2 items-center ${itemDragClass(String(index))}`}
                                    onDragOver={(e) => handleDragOver(e, String(index))}
                                    onDrop={(e) => handleDrop(e, String(index))}
                                >
                                    <span
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, String(index))}
                                        onDragEnd={handleDragEnd}
                                        className="text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
                                    >
                                        <GripVertical className="h-3 w-3" />
                                    </span>
                                    <Input
                                        value={text}
                                        onChange={(e) => updateText(index, e.target.value)}
                                        className="h-8 text-[12px] md:text-[12px]"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0"
                                        onClick={() => removeText(index)}
                                        disabled={texts.length <= 1}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addText}
                            className="w-full mt-3 h-8 text-[12px]"
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Agregar Mensaje
                        </Button>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="Enlace">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Enlace (opcional)</Label>
                        <Input
                            className="h-8 text-[12px] md:text-[12px]"
                            placeholder="https://, /blog, #tel"
                            value={link}
                            onChange={(e) =>
                                setProp((props: EditablePromotionalTextProps) => (props.link = e.target.value))
                            }
                        />
                    </div>
                </div>
            </SettingsSection>

            {/* Sin "Alineación": los mensajes van en una fila que se desplaza y
                cada uno se mide por su texto, asi que `text-align` no tiene
                caja donde repartir el sobrante y el campo no pintaria nada. */}
            <TypographySection
                legacy={typographyLegacyOf({ fontSize, fontFamily, textColor })}
                fields={{ textAlign: false }}
            />

            <SettingsSection title="Apariencia">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Fondo</Label>
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={backgroundColor}
                                onChange={(val) =>
                                    setProp((props: EditablePromotionalTextProps) => (props.backgroundColor = val))
                                }
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SpacingSection legacy={spacingLegacyOf({ paddingY })}>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] text-foreground/80">Relleno horizontal (px)</Label>
                    <Input
                        className="h-8 text-[12px] md:text-[12px]"
                        type="number"
                        min="0"
                        max="200"
                        value={paddingX}
                        onChange={(e) =>
                            setProp((props: EditablePromotionalTextProps) => (props.paddingX = parseInt(e.target.value) || 0))
                        }
                    />
                </div>
            </SpacingSection>

            <SettingsSection title="Movimiento">
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Velocidad</Label>
                            <Input
                                className="h-8 text-[12px] md:text-[12px]"
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="10"
                                value={speed}
                                onChange={(e) =>
                                    setProp((props: EditablePromotionalTextProps) => (props.speed = parseFloat(e.target.value)))
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px] text-foreground/80">Clones</Label>
                            <Input
                                className="h-8 text-[12px] md:text-[12px]"
                                type="number"
                                min="1"
                                max="50"
                                value={repetitions}
                                onChange={(e) =>
                                    setProp((props: EditablePromotionalTextProps) => (props.repetitions = parseInt(e.target.value) || 1))
                                }
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <BorderSection />

            <AdvancedSection
                customClass={customClass ?? ""}
                onCustomClassChange={(val) =>
                    setProp((props: EditablePromotionalTextProps) => (props.customClass = val))
                }
                customCss={customCss ?? ""}
                onCustomCssChange={(val) =>
                    setProp((props: EditablePromotionalTextProps) => (props.customCss = val))
                }
            />
        </div>
    )
}

EditablePromotionalText.craft = {
    displayName: "Cinta promocional",
    props: {
        texts: ["Texto promocional", "Envío gratis", "Devoluciones sin costo"],
        backgroundColor: "#000000",
        textColor: "#ffffff",
        link: "",
        speed: 1.2,
        repetitions: 9,
        fontSize: 14,
        fontFamily: "sans" as const,
        paddingX: 32,
        paddingY: 12,
        borderStyle: "solid" as const,
        borderColor: "transparent",
        hiddenOnDesktop: false,
        hiddenOnTablet: false,
        hiddenOnMobile: false,
    },
    related: {
        settings: EditablePromotionalTextSettings,
    },
    rules: {
        canDrag: () => true,
        // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
        canMoveIn: () => false,
    },
}
