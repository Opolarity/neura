// La seccion "Tipografia" del panel de propiedades: fuente, grosor, tamaño,
// alto de linea, espaciado entre letras, alineacion y color del texto.
//
// Es la tercera seccion general, detras de BorderSection y SpacingSection, y
// se usa igual que ellas:
//
//   - en su panel:   <TypographySection legacy={typographyLegacy} />
//   - en su render:  const letra = useTypographyCss(props, legacy)
//                    ... className={letra.className} ... {letra.styleTag}
//
// Las props que lee y escribe: fontFamily, fontWeight, size{Modo} +
// sizeUnit/sizeCustom (idem lineHeight y letterSpacing), textAlign{Modo} y
// textColor. Un bloque que ya guardaba su letra con otros nombres o sin modos
// —`fontSize` a secas, `triggerFontSizeNum`, `lineHeightNum`— la declara en
// `legacy`: la seccion la enseña y la migra al primer cambio, sin tocar lo ya
// publicado hasta entonces.
//
// Las tres medidas (tamaño, alto de linea, espaciado) reusan la maquinaria de
// `measure-editor.ts`, la misma del ancho y el alto: son medidas de un solo
// valor por modo con unidad compartida, y no hay motivo para tener dos
// cascadas distintas conviviendo.

import { useId, type ReactNode } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field"
import { ResponsiveField } from "@/modules/ecommerce/editor/components/responsive-field"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { useViewport } from "@/modules/ecommerce/editor/components/viewport-context"
import { measureFieldPropsOf } from "@/modules/ecommerce/editor/components/measure-editor"
import { modeOf } from "@/modules/ecommerce/editor/components/sides-editor"
import { FontFamilySelect } from "@/modules/ecommerce/editor/components/user-components/font-family-select"
import { PropertyUnitInput } from "@/modules/ecommerce/editor/components/user-components/property-unit-input"
import {
    boxRule,
    measureCascadeOf,
    type BoxMode,
    type MeasureLegacy,
    type MeasureNaming,
} from "@/modules/ecommerce/editor/components/box-measures"
import {
    fontFamilyMap,
    fontWeightLabels,
    fontWeightsByFamily,
    type FontFamily,
} from "@/modules/ecommerce/editor/lib/font-families"

// ── Como se llaman las props ────────────────────────────────────────────────

/**
 * Las tres medidas nombran sus props igual que el ancho y el alto: un valor por
 * modo y una unidad compartida por los tres. La unidad no se reparte por modo
 * porque cambiarla en el celular y no en el escritorio no resuelve ningun caso
 * real y duplicaria los desplegables de un panel que ya va justo de ancho.
 */
const namingOf = (base: string): MeasureNaming => ({
    value: (mode) => `${base}${mode}`,
    // El modo se ignora a proposito: los tres comparten unidad, asi que las
    // tres lecturas caen en la misma prop y la migracion la escribe una vez.
    unit: () => `${base}Unit`,
    custom: () => `${base}Custom`,
})

export const SIZE_NAMING = namingOf("size")
export const LINE_HEIGHT_NAMING = namingOf("lineHeight")
export const LETTER_SPACING_NAMING = namingOf("letterSpacing")

const SIZE_UNIT = "px"
const LINE_HEIGHT_UNIT = "px"
const LETTER_SPACING_UNIT = "px"

/** Ninguna medida tipografica admite "auto": no existe en CSS para estas tres. */
const SIN_AUTO = ["auto"] as const

const UNIDADES = [SIZE_NAMING, LINE_HEIGHT_NAMING, LETTER_SPACING_NAMING].map((n) =>
    n.unit("Desktop"),
)

/**
 * El bag con las unidades vacias quitadas.
 *
 * Hace falta porque `legacy` solo entra cuando la prop de unidad esta ausente
 * (`isLegacyMeasure` la compara con `undefined`), y varios bloques declaran la
 * suya en `craft.props` con el formato anterior —`lineHeightUnit: ""`—, que
 * llega a una pagina guardada aunque nadie la haya tocado. Sin esto su
 * `legacy` no se activaria nunca: el bloque se seguiria viendo bien, pero el
 * panel saldria en blanco y el primer cambio le borraria la medida vieja.
 *
 * Una cadena vacia no es una unidad: es la marca de que ahi no se eligio
 * ninguna, que es justo lo que `undefined` significa para la cascada.
 */
function sinUnidadesVacias(bag: Record<string, unknown>) {
    if (!UNIDADES.some((clave) => bag[clave] === "")) return bag
    const copia = { ...bag }
    for (const clave of UNIDADES) if (copia[clave] === "") delete copia[clave]
    return copia
}

/**
 * El grosor como numero.
 *
 * El formato anterior lo guardaba como texto —`"bold"`, `"700"`, `"normal"`—,
 * y al navegador le da igual, pero el desplegable compara contra numeros y se
 * queda en blanco con cualquiera de los tres. Se normaliza al leer y no al
 * escribir: reescribir la prop cambiaria el JSON de una pagina que nadie ha
 * tocado.
 */
function pesoNumerico(valor: unknown): number | undefined {
    if (typeof valor === "number") return valor
    if (typeof valor !== "string" || valor === "") return undefined
    if (valor === "bold") return 700
    if (valor === "normal") return 400
    const numero = Number(valor)
    return Number.isFinite(numero) ? numero : undefined
}

export type TextAlign = "left" | "center" | "right" | "justify"

const ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
    { value: "left", label: "Izquierda" },
    { value: "center", label: "Centro" },
    { value: "right", label: "Derecha" },
    { value: "justify", label: "Justificado" },
]

/**
 * Radix no admite `value=""`, asi que el estado "sin elegir" necesita un valor
 * con nombre. Se traduce a `undefined` al escribir, para que elegirlo borre la
 * prop de verdad en vez de guardar la palabra.
 */
const SIN_VALOR = "heredado"

/**
 * Lo que el bloque aplicaba antes de guardar su letra con estos nombres. Se
 * enseña mientras no tenga nada propio guardado y se migra al primer cambio.
 */
export type TypographyLegacy = {
    size?: MeasureLegacy
    lineHeight?: MeasureLegacy
    letterSpacing?: MeasureLegacy
    fontFamily?: FontFamily
    fontWeight?: number
    textAlign?: TextAlign
    textColor?: string
}

/** Que campos enseña la seccion. Por defecto, los siete. */
export type TypographyFields = {
    fontFamily?: boolean
    fontWeight?: boolean
    size?: boolean
    lineHeight?: boolean
    letterSpacing?: boolean
    textAlign?: boolean
    textColor?: boolean
}

// ── El panel ────────────────────────────────────────────────────────────────

export function TypographySection({
    legacy,
    fields,
    children,
    className,
    defaultOpen,
    title = "Tipografía",
}: {
    legacy?: TypographyLegacy
    fields?: TypographyFields
    /** Campos propios del bloque que van en esta misma seccion, al final. */
    children?: ReactNode
    /** Para la primera seccion del panel: `border-t-0`. */
    className?: string
    defaultOpen?: boolean
    /** Para el bloque que edita la letra de una parte suya ("Tipografía del botón"). */
    title?: string
}) {
    const {
        actions: { setProp },
        bag: bagCrudo,
    } = useNode((node) => ({ bag: node.data.props as Record<string, unknown> }))
    const bag = sinUnidadesVacias(bagCrudo)
    const viewport = useViewport() ?? "desktop"
    const modo = modeOf(viewport)
    const show = {
        fontFamily: true,
        fontWeight: true,
        size: true,
        lineHeight: true,
        letterSpacing: true,
        textAlign: true,
        textColor: true,
        ...fields,
    }

    const write = (cambio: (p: Record<string, unknown>) => void) =>
        setProp((props: Record<string, unknown>) => cambio(props))

    const fontFamily = (bag.fontFamily as FontFamily | undefined) ?? legacy?.fontFamily
    const fontWeight = pesoNumerico(bag.fontWeight) ?? legacy?.fontWeight
    const textColor = (bag.textColor as string | undefined) ?? legacy?.textColor

    // Los grosores que existen de verdad en la familia elegida. Ofrecer los
    // nueve en una fuente que solo trae dos deja elegir un grosor que el
    // navegador falsea o ignora.
    const pesos = fontWeightsByFamily[fontFamily ?? "sans"] ?? []

    const alineacion =
        (bag[`textAlign${modo}`] as TextAlign | undefined) ??
        (modo === "Desktop" ? legacy?.textAlign : undefined)

    return (
        <SettingsSection title={title} className={className} defaultOpen={defaultOpen}>
            <div className="flex flex-col gap-3">
                {show.fontFamily && (
                    <PanelField label="Fuente">
                        {(id) => (
                            <FontFamilySelect
                                id={id}
                                value={fontFamily ?? "sans"}
                                onChange={(val) => write((p) => (p.fontFamily = val))}
                            />
                        )}
                    </PanelField>
                )}

                {show.fontWeight && pesos.length > 0 && (
                    <PanelField label="Grosor">
                        {(id) => (
                            <Select
                                value={fontWeight != null ? String(fontWeight) : SIN_VALOR}
                                onValueChange={(val) =>
                                    write((p) => {
                                        p.fontWeight = val === SIN_VALOR ? undefined : Number(val)
                                    })
                                }
                            >
                                <SelectTrigger id={id} className="h-8 text-[12px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Sin grosor propio el bloque hereda el del sitio: es
                                        un estado valido y hay que poder volver a el. */}
                                    <SelectItem className="text-[12px]" value={SIN_VALOR}>
                                        Heredado
                                    </SelectItem>
                                    {pesos.map((peso) => (
                                        <SelectItem
                                            key={peso}
                                            className="text-[12px]"
                                            value={String(peso)}
                                        >
                                            {fontWeightLabels[peso] ?? String(peso)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </PanelField>
                )}

                {show.size && (
                    <ResponsiveField label="Tamaño de fuente">
                        {(activeViewport, id) => (
                            <PropertyUnitInput
                                id={id}
                                {...measureFieldPropsOf(bag, write, activeViewport, SIZE_NAMING, {
                                    defaultUnit: SIZE_UNIT,
                                    legacy: legacy?.size,
                                    exclude: [...SIN_AUTO],
                                })}
                            />
                        )}
                    </ResponsiveField>
                )}

                {show.lineHeight && (
                    <ResponsiveField label="Alto de línea">
                        {(activeViewport, id) => (
                            <PropertyUnitInput
                                id={id}
                                {...measureFieldPropsOf(
                                    bag,
                                    write,
                                    activeViewport,
                                    LINE_HEIGHT_NAMING,
                                    {
                                        defaultUnit: LINE_HEIGHT_UNIT,
                                        legacy: legacy?.lineHeight,
                                        exclude: [...SIN_AUTO],
                                    },
                                )}
                            />
                        )}
                    </ResponsiveField>
                )}

                {show.letterSpacing && (
                    <ResponsiveField label="Espaciado entre letras">
                        {(activeViewport, id) => (
                            <PropertyUnitInput
                                id={id}
                                {...measureFieldPropsOf(
                                    bag,
                                    write,
                                    activeViewport,
                                    LETTER_SPACING_NAMING,
                                    {
                                        defaultUnit: LETTER_SPACING_UNIT,
                                        legacy: legacy?.letterSpacing,
                                        exclude: [...SIN_AUTO],
                                    },
                                )}
                            />
                        )}
                    </ResponsiveField>
                )}

                {show.textAlign && (
                    <ResponsiveField label="Alineación">
                        {(activeViewport, id) => {
                            const prop = `textAlign${modeOf(activeViewport)}`
                            return (
                                <Select
                                    value={(bag[prop] as TextAlign | undefined) ?? SIN_VALOR}
                                    onValueChange={(val) =>
                                        write((p) => {
                                            p[prop] = val === SIN_VALOR ? undefined : (val as TextAlign)
                                        })
                                    }
                                >
                                    <SelectTrigger id={id} className="h-8 text-[12px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Sin alineacion propia se hereda la del
                                            contenedor, que es como nacieron los bloques
                                            ya publicados. */}
                                        <SelectItem className="text-[12px]" value={SIN_VALOR}>
                                            {alineacion
                                                ? `Heredada (${ALIGN_OPTIONS.find((o) => o.value === alineacion)?.label})`
                                                : "Heredada"}
                                        </SelectItem>
                                        {ALIGN_OPTIONS.map((opcion) => (
                                            <SelectItem
                                                key={opcion.value}
                                                className="text-[12px]"
                                                value={opcion.value}
                                            >
                                                {opcion.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )
                        }}
                    </ResponsiveField>
                )}

                {show.textColor && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Color de texto</Label>
                        {/* ColorField no acepta className: se le llega con un variant
                            descendiente, que gana por especificidad. */}
                        <div className="[&_button]:h-8 [&_button]:text-[12px]">
                            <ColorField
                                value={textColor}
                                onChange={(val) => write((p) => (p.textColor = val))}
                            />
                        </div>
                    </div>
                )}

                {children}
            </div>
        </SettingsSection>
    )
}

// ── El CSS ──────────────────────────────────────────────────────────────────

/**
 * Las reglas de letra de un bloque, ya resueltas por modo de pantalla. Para el
 * que emite su propio `<style>`; los demas usan `useTypographyCss`.
 *
 * Lo que no tiene valor no escribe regla: un bloque ya publicado hereda la
 * letra de su contenedor, y ponerle un tamaño o un color por defecto se la
 * cambiaria sin que nadie lo haya pedido.
 */
export function typographyRulesOf(
    bagCrudo: Record<string, unknown>,
    legacy?: TypographyLegacy,
) {
    // El render tiene que ver lo mismo que el panel, o el bloque se pintaria
    // con una medida y el panel enseñaria otra. Ver `sinUnidadesVacias`.
    const bag = sinUnidadesVacias(bagCrudo)
    const size = measureCascadeOf(bag, SIZE_NAMING, SIZE_UNIT, legacy?.size)
    const lineHeight = measureCascadeOf(
        bag,
        LINE_HEIGHT_NAMING,
        LINE_HEIGHT_UNIT,
        legacy?.lineHeight,
    )
    const letterSpacing = measureCascadeOf(
        bag,
        LETTER_SPACING_NAMING,
        LETTER_SPACING_UNIT,
        legacy?.letterSpacing,
    )

    const fontFamily = (bag.fontFamily as FontFamily | undefined) ?? legacy?.fontFamily
    const fontWeight = pesoNumerico(bag.fontWeight) ?? legacy?.fontWeight
    const textColor = (bag.textColor as string | undefined) ?? legacy?.textColor

    // Los modos en minuscula son los de la cascada de medidas; `BoxMode` los
    // nombra capitalizados porque asi se llaman las props (`sizeDesktop`).
    type Modo = "desktop" | "tablet" | "mobile"
    const BOX: Record<Modo, BoxMode> = {
        desktop: "Desktop",
        tablet: "Tablet",
        mobile: "Mobile",
    }

    const alignOf = (modo: Modo): TextAlign | undefined => {
        const propio = bag[`textAlign${BOX[modo]}`] as TextAlign | undefined
        if (propio) return propio
        if (modo === "desktop") return legacy?.textAlign
        // Tableta y celular heredan del modo mayor, como las medidas.
        return alignOf(modo === "mobile" ? "tablet" : "desktop")
    }

    // La familia, el grosor y el color no se reparten por modo: nadie ha
    // necesitado otra fuente en el celular, y repartirlos triplicaria el panel.
    const comunes =
        (fontFamily ? `font-family: ${fontFamilyMap[fontFamily]};` : "") +
        (fontWeight != null ? `font-weight: ${fontWeight};` : "") +
        (textColor ? `color: ${textColor};` : "")

    const reglas = (modo: Modo) => {
        const align = alignOf(modo)
        return (
            comunes +
            boxRule("font-size", size[modo].value, size[modo].unit, size[modo].custom) +
            boxRule(
                "line-height",
                lineHeight[modo].value,
                lineHeight[modo].unit,
                lineHeight[modo].custom,
            ) +
            boxRule(
                "letter-spacing",
                letterSpacing[modo].value,
                letterSpacing[modo].unit,
                letterSpacing[modo].custom,
            ) +
            (align ? `text-align: ${align};` : "")
        )
    }

    return { desktop: reglas("desktop"), tablet: reglas("tablet"), mobile: reglas("mobile") }
}

/**
 * La clase y el `<style>` con la letra de un bloque, para el que no emite un
 * `<style>` propio. Gemelo de `useSpacingCss` y `useBorderCss`.
 *
 * Mientras se edita se escribe solo el modo que se esta viendo, para que el
 * lienzo enseñe la tableta o el celular sin tener que estrechar la ventana.
 */
export function useTypographyCss(
    bag: Record<string, unknown>,
    legacy?: TypographyLegacy,
) {
    const id = useId()
    const className = `editable-typography-${id.replace(/:/g, "")}`
    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))
    const viewport = useViewport()
    const rules = typographyRulesOf(bag, legacy)

    const css =
        enabled && viewport
            ? `.${className} { ${rules[viewport]} }`
            : `
        @media (max-width: 767px) { .${className} { ${rules.mobile} } }
        @media (min-width: 768px) and (max-width: 1023px) { .${className} { ${rules.tablet} } }
        @media (min-width: 1024px) { .${className} { ${rules.desktop} } }
      `

    return { className, styleTag: <style>{css}</style> }
}
