// La seccion "Tamaño y espaciado" del panel de propiedades, la misma para
// todos los bloques del editor: ancho, alto (con sus minimos y maximos),
// relleno y margen, por modo de
// pantalla y con unidad, en cascada (ver box-measures). Nacio en el Boton.
//
// Un bloque la usa en dos sitios:
//
//   - en su panel:   <SpacingSection legacy={...} />
//   - en su render:  const medidas = useSpacingCss(props, legacy)
//                    ... className={medidas.className} ... {medidas.styleTag}
//
// Las props que lee y escribe: width{Modo}, widthUnit{Modo}, widthCustom{Modo}
// (idem height, minWidth, maxWidth, minHeight y maxHeight), padding{Lado}{Modo}, paddingUnit{Modo}, paddingCustom{Modo}
// (idem margin). Un bloque que ya guardaba medidas con otros nombres o con un
// solo valor pasa `legacy` para que el panel las enseñe y las migre al primer
// cambio, y para que el render las siga pintando mientras tanto.
//
// Lo que no es de aqui (el `gap` de una rejilla, la altura minima de un
// contenedor, el desbordamiento) va en `children`, al final de la seccion.

import { useId, type ReactNode } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { ResponsiveField } from "@/modules/ecommerce/editor/components/responsive-field"
import { SidesField } from "@/modules/ecommerce/editor/components/sides-field"
import { PropertyUnitInput } from "@/modules/ecommerce/editor/components/user-components/property-unit-input"
import type { PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select"
import { useViewport } from "@/modules/ecommerce/editor/components/viewport-context"
import { sidesFieldPropsOf } from "@/modules/ecommerce/editor/components/sides-editor"
import { measureFieldPropsOf } from "@/modules/ecommerce/editor/components/measure-editor"
import {
    HEIGHT_NAMING,
    MARGIN_NAMING,
    MAX_HEIGHT_NAMING,
    MAX_WIDTH_NAMING,
    MIN_HEIGHT_NAMING,
    MIN_WIDTH_NAMING,
    PADDING_NAMING,
    WIDTH_NAMING,
    boxRule,
    cascadeOf,
    measureCascadeOf,
    sidesRulesOf,
    type MeasureSpec,
    type MeasureNaming,
    type BoxSide,
    type MeasureLegacy,
    type SidesLegacy,
    type SidesSpec,
} from "@/modules/ecommerce/editor/components/box-measures"

/**
 * Lo que el bloque aplicaba antes de guardar las medidas por modo. El relleno
 * y el margen admiten un juego por modo, para los bloques que ya distinguian
 * el celular.
 */
export type SpacingLegacy = {
    width?: MeasureLegacy
    height?: MeasureLegacy
    minWidth?: MeasureLegacy
    maxWidth?: MeasureLegacy
    minHeight?: MeasureLegacy
    maxHeight?: MeasureLegacy
    padding?: SidesLegacy<BoxSide>
    paddingValueFor?: (side: BoxSide) => number | undefined
    margin?: SidesLegacy<BoxSide>
    marginValueFor?: (side: BoxSide) => number | undefined
}

/**
 * Una medida guardada como texto CSS —"400px", "100%", "auto", "50vh"— pasada
 * a `MeasureSpec`: numero y unidad si es px o %, `auto` tal cual, y cualquier
 * otra cosa como texto libre.
 */
export function measureFromCss(text: string | number | undefined): MeasureSpec {
    if (text === undefined || text === null || text === "") return { value: undefined, unit: "px", custom: "" }
    if (typeof text === "number") return { value: text, unit: "px", custom: "" }
    const t = String(text).trim()
    if (t === "auto") return { value: undefined, unit: "auto", custom: "" }
    const m = /^(-?[\d.]+)(px|%)$/.exec(t)
    if (m) return { value: Number(m[1]), unit: m[2] as "px" | "%", custom: "" }
    if (/^-?[\d.]+$/.test(t)) return { value: Number(t), unit: "px", custom: "" }
    return { value: undefined, unit: "custom", custom: t }
}

/** Un `SidesSpec` con los cuatro lados al mismo numero, en px. */
export function uniformSpacing(value: number | undefined): SidesSpec<BoxSide> {
    return {
        sides: { Top: value, Right: value, Bottom: value, Left: value },
        unit: "px",
        custom: "",
    }
}

/** Un `MeasureLegacy` con la misma medida en los tres modos. */
export function uniformMeasure(
    value: number | undefined,
    unit: "px" | "%" = "px",
): MeasureLegacy {
    const spec = { value, unit, custom: "" } as const
    return { desktop: spec, tablet: spec, mobile: spec }
}

// El ancho arranca en %: "100% del sitio" es lo que un bloque nuevo quiere
// decir. El alto en px: un alto en % no significa nada sin un padre medido.
const WIDTH_UNIT = "%"
const HEIGHT_UNIT = "px"
// Los limites arrancan en px: "no mas de 1200px" o "al menos 300px" es lo que
// se suele querer decir con ellos.
const LIMIT_UNIT = "px"

export type SpacingFieldsShown = {
    width?: boolean
    height?: boolean
    /** Por defecto siguen a `width`: sin ancho no hay limites de ancho. */
    minWidth?: boolean
    maxWidth?: boolean
    /** Por defecto siguen a `height`. */
    minHeight?: boolean
    maxHeight?: boolean
    padding?: boolean
    margin?: boolean
}

type Write = (cambio: (p: Record<string, unknown>) => void) => void

export function SpacingSection({
    legacy,
    fields,
    children,
    className,
    defaultOpen,
}: {
    legacy?: SpacingLegacy
    /** Que campos enseñar. Por defecto todos. */
    fields?: SpacingFieldsShown
    /** Campos propios del bloque que van en esta misma seccion, al final. */
    children?: ReactNode
    /** Para la primera seccion del panel: `border-t-0`. */
    className?: string
    defaultOpen?: boolean
}) {
    const {
        actions: { setProp },
        bag,
    } = useNode((node) => ({ bag: node.data.props as Record<string, unknown> }))

    const write: Write = (cambio) =>
        setProp((props: Record<string, unknown>) => cambio(props))

    return (
        <SettingsSection title="Tamaño y espaciado" className={className} defaultOpen={defaultOpen}>
            <SpacingFields bag={bag} write={write} legacy={legacy} fields={fields}>
                {children}
            </SpacingFields>
        </SettingsSection>
    )
}

/**
 * Los campos de la seccion, sin la seccion ni el nodo: leen de `bag` y
 * escriben con `write`. Lo usa lo que no es un bloque de craft pero guarda sus
 * medidas con los mismos nombres, como la config de un popup.
 */
export function SpacingFields({
    bag,
    write,
    legacy,
    fields,
    children,
}: {
    bag: Record<string, unknown>
    write: Write
    legacy?: SpacingLegacy
    fields?: SpacingFieldsShown
    children?: ReactNode
}) {
    const viewport = useViewport() ?? "desktop"
    const width = fields?.width ?? true
    const height = fields?.height ?? true
    const show = {
        minWidth: width,
        maxWidth: width,
        minHeight: height,
        maxHeight: height,
        padding: true,
        margin: true,
        ...fields,
        width,
        height,
    }

    const measure = (
        label: string,
        naming: MeasureNaming,
        defaultUnit: PropertyUnit,
        measureLegacy: MeasureLegacy | undefined,
    ) => (
        <ResponsiveField label={label}>
            {(activeViewport, id) => (
                <PropertyUnitInput
                    id={id}
                    {...measureFieldPropsOf(bag, write, activeViewport, naming, {
                        defaultUnit,
                        legacy: measureLegacy,
                    })}
                />
            )}
        </ResponsiveField>
    )

    return (
        <div className="flex flex-col gap-3">
            {show.width && measure("Ancho", WIDTH_NAMING, WIDTH_UNIT, legacy?.width)}
            {show.minWidth && measure("Ancho mínimo", MIN_WIDTH_NAMING, LIMIT_UNIT, legacy?.minWidth)}
            {show.maxWidth && measure("Ancho máximo", MAX_WIDTH_NAMING, LIMIT_UNIT, legacy?.maxWidth)}

            {show.height && measure("Alto", HEIGHT_NAMING, HEIGHT_UNIT, legacy?.height)}
            {show.minHeight && measure("Alto mínimo", MIN_HEIGHT_NAMING, LIMIT_UNIT, legacy?.minHeight)}
            {show.maxHeight && measure("Alto máximo", MAX_HEIGHT_NAMING, LIMIT_UNIT, legacy?.maxHeight)}

            {show.padding && (
                <SidesField
                    {...sidesFieldPropsOf(bag, write, viewport, PADDING_NAMING, {
                        label: "Relleno",
                        legacySpec: legacy?.padding,
                        legacyValueFor: legacy?.paddingValueFor,
                    })}
                />
            )}

            {show.margin && (
                <SidesField
                    {...sidesFieldPropsOf(bag, write, viewport, MARGIN_NAMING, {
                        label: "Margen",
                        legacySpec: legacy?.margin,
                        legacyValueFor: legacy?.marginValueFor,
                    })}
                />
            )}

            {children}
        </div>
    )
}

/**
 * Las reglas de minimos y maximos por modo. Aparte del resto porque el Boton
 * arma su ancho y su alto por su cuenta y solo necesita estas.
 */
export function limitRulesByViewport(bag: Record<string, unknown>, legacy?: SpacingLegacy) {
    const minWidth = measureCascadeOf(bag, MIN_WIDTH_NAMING, LIMIT_UNIT, legacy?.minWidth)
    const maxWidth = measureCascadeOf(bag, MAX_WIDTH_NAMING, LIMIT_UNIT, legacy?.maxWidth)
    const minHeight = measureCascadeOf(bag, MIN_HEIGHT_NAMING, LIMIT_UNIT, legacy?.minHeight)
    const maxHeight = measureCascadeOf(bag, MAX_HEIGHT_NAMING, LIMIT_UNIT, legacy?.maxHeight)
    const of = (modo: "desktop" | "tablet" | "mobile") =>
        boxRule("min-width", minWidth[modo].value, minWidth[modo].unit, minWidth[modo].custom) +
        boxRule("max-width", maxWidth[modo].value, maxWidth[modo].unit, maxWidth[modo].custom) +
        boxRule("min-height", minHeight[modo].value, minHeight[modo].unit, minHeight[modo].custom) +
        boxRule("max-height", maxHeight[modo].value, maxHeight[modo].unit, maxHeight[modo].custom)
    return { desktop: of("desktop"), tablet: of("tablet"), mobile: of("mobile") }
}

/**
 * Las reglas de medidas de un bloque, ya resueltas por modo de pantalla. Para
 * el que emite su propio `<style>`; los demas usan `useSpacingCss`.
 */
export function spacingRulesByViewport(bag: Record<string, unknown>, legacy?: SpacingLegacy) {
    const width = measureCascadeOf(bag, WIDTH_NAMING, WIDTH_UNIT, legacy?.width)
    const height = measureCascadeOf(bag, HEIGHT_NAMING, HEIGHT_UNIT, legacy?.height)
    const padding = cascadeOf(bag, PADDING_NAMING, legacy?.padding)
    const margin = cascadeOf(bag, MARGIN_NAMING, legacy?.margin)
    const limits = limitRulesByViewport(bag, legacy)
    const of = (modo: "desktop" | "tablet" | "mobile") =>
        boxRule("width", width[modo].value, width[modo].unit, width[modo].custom) +
        boxRule("height", height[modo].value, height[modo].unit, height[modo].custom) +
        limits[modo] +
        sidesRulesOf("padding", padding[modo]) +
        sidesRulesOf("margin", margin[modo])
    return { desktop: of("desktop"), tablet: of("tablet"), mobile: of("mobile") }
}

/**
 * La clase y el `<style>` con las medidas de un bloque, para el que no emite
 * CSS propio. En el editor solo va el modo que se esta viendo; en la tienda
 * los tres con sus media queries.
 */
export function useSpacingCss(bag: Record<string, unknown>, legacy?: SpacingLegacy) {
    const id = useId()
    const className = `editable-spacing-${id.replace(/:/g, "")}`
    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))
    const viewport = useViewport()
    const rules = spacingRulesByViewport(bag, legacy)

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
