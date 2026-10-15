// El pegamento entre las props de un bloque y el control `SidesField`.
//
// Una propiedad de cuatro partes —relleno, margen, grosor de borde, radio— se
// guarda por modo de pantalla y con su unidad, y `SidesField` necesita saber
// que tiene el modo activo, que hereda y como escribir cada cambio. Ese calculo
// es el mismo para las cuatro propiedades y para todos los bloques; solo
// cambian los nombres de las props (`SidesNaming`) y el formato anterior, si
// lo hubo. Nacio dentro de editable-rich-text.tsx como `ladosDe`.

import type { SidePart } from "@/modules/ecommerce/editor/components/sides-field"
import type { Viewport } from "@/modules/ecommerce/editor/components/viewport-context"
import type { PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select"
import {
    cascadeOf,
    isLegacySides,
    legacySidesFor,
    materializeSidesWith,
    specOf,
    type BoxMode,
    type SidesLegacy,
    type SidesNaming,
    type SidesSpec,
} from "@/modules/ecommerce/editor/components/box-measures"

/** El modo de caja que corresponde al viewport que se esta viendo. */
export function modeOf(viewport: Viewport): BoxMode {
    return viewport === "mobile" ? "Mobile" : viewport === "tablet" ? "Tablet" : "Desktop"
}

export type SidesEditorOptions<K extends string> = {
    label: string
    parts?: readonly SidePart<K>[]
    exclude?: PropertyUnit[]
    customPlaceholder?: string
    /** Lo que el bloque aplicaba antes de tener modos, si lo hubo. */
    legacySpec?: SidesLegacy<K>
    /**
     * De donde sale el valor anterior de cada parte al migrar. Por defecto de
     * `naming.legacyValue(part)`; un bloque que lo guardaba con otro nombre lo
     * dice aqui.
     */
    legacyValueFor?: (part: K) => number | undefined
}

/**
 * Todo lo que `SidesField` necesita de una propiedad de cuatro partes, listo
 * para esparcir: `<SidesField {...sidesFieldPropsOf(...)} />`.
 *
 * `write` es la escritura del bloque (`setProp` envuelto): recibe un cambio
 * sobre la bolsa de props y lo aplica. Antes de cualquier escritura se saca al
 * bloque del formato anterior, porque mientras siga en el lo escrito no se
 * veria en el canvas.
 */
export function sidesFieldPropsOf<K extends string>(
    bag: Record<string, unknown>,
    write: (cambio: (p: Record<string, unknown>) => void) => void,
    viewport: Viewport,
    naming: SidesNaming<K>,
    opciones: SidesEditorOptions<K>,
) {
    const modo = modeOf(viewport)
    const { legacySpec, legacyValueFor } = opciones
    const enFormatoAnterior = legacySpec !== undefined && isLegacySides(bag, naming)
    const cascada = cascadeOf(bag, naming, legacySpec)
    // Con el formato anterior cada modo enseña lo que tenia entonces, que es lo
    // que se le va a escribir en cuanto se toque cualquier campo; el que no
    // tenia nada hereda, como hara despues.
    const vacio: SidesSpec<K> = { sides: {}, unit: "px", custom: "" }
    const propias: SidesSpec<K> = enFormatoAnterior
        ? legacySidesFor(legacySpec, modo) ?? vacio
        : specOf(bag, naming, modo)
    // Escritorio no hereda de nadie: es el que manda.
    const heredado =
        modo === "Mobile" ? cascada.tablet : modo === "Tablet" ? cascada.desktop : undefined

    const escribir = (cambio: (p: Record<string, unknown>) => void) =>
        write((p) => {
            materializeSidesWith(p, naming, legacyValueFor, legacySpec)
            cambio(p)
        })

    return {
        label: opciones.label,
        parts: opciones.parts,
        exclude: opciones.exclude,
        customPlaceholder: opciones.customPlaceholder,
        viewport,
        unit: propias.unit,
        custom: propias.custom,
        sides: propias.sides,
        inherited: heredado,
        inherits:
            naming.parts.every((part) => propias.sides[part] == null) &&
            heredado !== undefined,
        onUnitChange: (next: PropertyUnit) =>
            escribir((p) => {
                p[naming.unit(modo)] = next
            }),
        onCustomChange: (next: string) =>
            escribir((p) => {
                p[naming.custom(modo)] = next
            }),
        onSideChange: (part: K, value: number | undefined, adoptUnit?: PropertyUnit) =>
            escribir((p) => {
                if (adoptUnit) p[naming.unit(modo)] = adoptUnit
                p[naming.value(part, modo)] = value
            }),
        onAllChange: (value: number | undefined, adoptUnit?: PropertyUnit) =>
            escribir((p) => {
                if (adoptUnit) p[naming.unit(modo)] = adoptUnit
                for (const part of naming.parts) p[naming.value(part, modo)] = value
            }),
    }
}
