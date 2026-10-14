// La seccion "Bordes" del panel de propiedades, la misma para todos los
// bloques del editor: estilo del trazo, grosor por lado, color y radio por
// esquina. Grosor y radio van por modo de pantalla y con unidad, en cascada
// (ver box-measures), como en el Boton, que fue el primero en tenerlos.
//
// Un bloque la usa en dos sitios:
//
//   - en su panel:   <BorderSection />
//   - en su render:  const borde = useBorderCss(props)
//                    ... className={borde.className} ... {borde.styleTag}
//
// Las props que lee y escribe son siempre las mismas (borderStyle,
// border{Lado}Width{Modo}, borderWidthUnit{Modo}, borderWidthCustom{Modo},
// borderColor, border{Esquina}Radius{Modo}, borderRadiusUnit{Modo},
// borderRadiusCustom{Modo}). Un bloque que ya guardaba bordes con otros
// nombres pasa `legacy` para que el panel los enseñe y los migre al primer
// cambio, y para que el render los siga pintando mientras tanto.

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
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { SidesField } from "@/modules/ecommerce/editor/components/sides-field"
import { useViewport } from "@/modules/ecommerce/editor/components/viewport-context"
import { sidesFieldPropsOf } from "@/modules/ecommerce/editor/components/sides-editor"
import {
    BORDER_STYLES,
    BORDER_WIDTH_NAMING,
    RADIUS_CORNERS,
    RADIUS_NAMING,
    borderRulesOf,
    cascadeOf,
    radiusRulesOf,
    type BorderStyle,
    type BoxSide,
    type RadiusCorner,
    type SidesSpec,
} from "@/modules/ecommerce/editor/components/box-measures"

/**
 * Lo que el bloque aplicaba antes de guardar los bordes por modo. `width` y
 * `radius` son lo que se ve mientras no se toque el panel; `widthValueFor` y
 * `radiusValueFor` dicen de donde sale cada parte al migrar, cuando el nombre
 * anterior no era `border{Lado}Width` / `border{Esquina}Radius`.
 */
export type BorderLegacy = {
    width?: SidesSpec<BoxSide>
    widthValueFor?: (side: BoxSide) => number | undefined
    radius?: SidesSpec<RadiusCorner>
    radiusValueFor?: (corner: RadiusCorner) => number | undefined
}

/** Un `SidesSpec` con las cuatro partes al mismo numero, en px. */
export function uniformSides<K extends string>(
    parts: readonly K[],
    value: number | undefined,
): SidesSpec<K> {
    const sides = {} as Partial<Record<K, number | undefined>>
    for (const part of parts) sides[part] = value
    return { sides, unit: "px", custom: "" }
}

export function BorderSection({
    legacy,
    className,
    defaultOpen,
}: {
    legacy?: BorderLegacy
    /** Para la primera seccion del panel: `border-t-0`. */
    className?: string
    defaultOpen?: boolean
}) {
    const {
        actions: { setProp },
        bag,
    } = useNode((node) => ({ bag: node.data.props as Record<string, unknown> }))

    const write = (cambio: (p: Record<string, unknown>) => void) =>
        setProp((props: Record<string, unknown>) => cambio(props))

    return (
        <SettingsSection title="Bordes" className={className} defaultOpen={defaultOpen}>
            <BorderFields bag={bag} write={write} legacy={legacy} />
        </SettingsSection>
    )
}

/**
 * Los campos de la seccion, sin la seccion ni el nodo: leen de `bag` y
 * escriben con `write`. Ver SpacingFields.
 */
export function BorderFields({
    bag,
    write,
    legacy,
    children,
}: {
    bag: Record<string, unknown>
    write: (cambio: (p: Record<string, unknown>) => void) => void
    legacy?: BorderLegacy
    /** Campos propios de quien la usa, al final. */
    children?: ReactNode
}) {
    const viewport = useViewport() ?? "desktop"
    const borderStyle = (bag.borderStyle as BorderStyle | undefined) ?? "solid"
    const borderColor = bag.borderColor as string | undefined

    return (
        <div className="flex flex-col gap-3">
            {/* Estilo primero: es lo que decide si lo demas se ve como
                linea, guiones o puntos. Sin grosor no pinta nada, y el
                render ya lo resuelve. */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">Estilo de borde</Label>
                <Select
                    value={borderStyle}
                    onValueChange={(val) =>
                        write((p) => {
                            p.borderStyle = val as BorderStyle
                        })
                    }
                >
                    <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {BORDER_STYLES.map(({ value, label }) => (
                            <SelectItem key={value} className="text-[12px]" value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <SidesField
                {...sidesFieldPropsOf(bag, write, viewport, BORDER_WIDTH_NAMING, {
                    label: "Grosor de borde",
                    // Ni `auto` ni `%`: el grosor de un borde no se mide en
                    // porcentaje —CSS no lo admite— y automatico no
                    // significa nada aqui.
                    exclude: ["auto", "%"],
                    customPlaceholder: "ej: 1px 2px",
                    legacySpec: legacy?.width,
                    legacyValueFor: legacy?.widthValueFor,
                })}
            />

            <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-foreground/80">Color de borde</Label>
                <div className="[&_button]:h-8 [&_button]:text-[12px]">
                    <ColorField
                        value={borderColor}
                        onChange={(val) =>
                            write((p) => {
                                p.borderColor = val
                            })
                        }
                    />
                </div>
            </div>

            <SidesField
                {...sidesFieldPropsOf(bag, write, viewport, RADIUS_NAMING, {
                    label: "Radio de borde",
                    parts: RADIUS_CORNERS,
                    customPlaceholder: "ej: 9999px, 50%",
                    legacySpec: legacy?.radius,
                    legacyValueFor: legacy?.radiusValueFor,
                })}
            />

            {children}
        </div>
    )
}

/**
 * Las reglas de borde de un bloque, ya resueltas por modo de pantalla.
 *
 * Es lo que un bloque con su propio bloque `<style>` (el Boton, el Texto
 * enriquecido) mete dentro de sus reglas; los demas usan `useBorderCss`, que
 * ademas fabrica la clase y el `<style>`.
 */
export function borderRulesByViewport(
    bag: Record<string, unknown>,
    legacy?: BorderLegacy,
) {
    const style = (bag.borderStyle as BorderStyle | undefined) ?? "solid"
    const color = (bag.borderColor as string | undefined) ?? "transparent"
    const width = cascadeOf(bag, BORDER_WIDTH_NAMING, legacy?.width)
    const radius = cascadeOf(bag, RADIUS_NAMING, legacy?.radius)
    // El color solo acompaña a un grosor: sin grosor definido, emitirlo pisaria
    // el color del borde que el bloque traiga de su propia clase.
    const of = (modo: "desktop" | "tablet" | "mobile") => {
        const widthRules = borderRulesOf(width[modo], style)
        return (
            widthRules +
            radiusRulesOf(radius[modo]) +
            (widthRules ? `border-color: ${color};` : "")
        )
    }
    return { desktop: of("desktop"), tablet: of("tablet"), mobile: of("mobile") }
}

/**
 * La clase y el `<style>` con los bordes de un bloque, para el que no emite
 * CSS propio: se le pone `className` al elemento que lleva el borde y se
 * renderiza `styleTag` a su lado.
 *
 * En el editor solo se emite el modo que se esta viendo, para que el canvas
 * responda al selector de pantalla y no al ancho real de la ventana; en la
 * tienda van los tres con sus media queries.
 */
export function useBorderCss(bag: Record<string, unknown>, legacy?: BorderLegacy) {
    const id = useId()
    const className = `editable-border-${id.replace(/:/g, "")}`
    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))
    const viewport = useViewport()
    const rules = borderRulesByViewport(bag, legacy)

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
