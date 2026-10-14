// El pegamento entre las props de un bloque y el control `PropertyUnitInput`
// para una medida de un solo valor por modo de pantalla: el ancho y el alto.
//
// Es el gemelo de sides-editor.ts para lo que no tiene cuatro lados. Nacio
// repetido dentro de editable-button.tsx y editable-rich-text.tsx.

import type { Viewport } from "@/modules/ecommerce/editor/components/viewport-context"
import type { PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select"
import { modeOf } from "@/modules/ecommerce/editor/components/sides-editor"
import {
    hasOwnMeasure,
    isLegacyMeasure,
    materializeMeasure,
    measureCascadeOf,
    measurePlaceholder,
    measureSpecOf,
    type MeasureLegacy,
    type MeasureNaming,
} from "@/modules/ecommerce/editor/components/box-measures"

export type MeasureEditorOptions = {
    /** La unidad con la que arranca la medida: % para el ancho, px para el alto. */
    defaultUnit: PropertyUnit
    /** Lo que el bloque aplicaba antes de tener modos, si lo hubo. */
    legacy?: MeasureLegacy
    exclude?: PropertyUnit[]
}

/**
 * Todo lo que `PropertyUnitInput` necesita de una medida, listo para
 * esparcir: `<PropertyUnitInput id={id} {...measureFieldPropsOf(...)} />`.
 *
 * Mientras un modo hereda, el desplegable enseña la unidad de la que hereda y
 * el campo lleva de apoyo lo que se esta aplicando; al estrenar el campo se
 * adopta esa unidad, porque escribir 50 sobre un escritorio en % y guardarlo
 * en px seria otra medida.
 */
export function measureFieldPropsOf(
    bag: Record<string, unknown>,
    write: (cambio: (p: Record<string, unknown>) => void) => void,
    viewport: Viewport,
    naming: MeasureNaming,
    { defaultUnit, legacy, exclude }: MeasureEditorOptions,
) {
    const modo = modeOf(viewport)
    const key = viewport as keyof MeasureLegacy
    const enFormatoAnterior = legacy !== undefined && isLegacyMeasure(bag, naming)
    const cascada = measureCascadeOf(bag, naming, defaultUnit, legacy)
    const propia =
        enFormatoAnterior && legacy?.[key]
            ? legacy[key]!
            : measureSpecOf(bag, naming, modo, defaultUnit)
    // Escritorio no hereda de nadie: es el que manda.
    const heredada =
        viewport === "mobile" ? cascada.tablet : viewport === "tablet" ? cascada.desktop : undefined
    const hereda = !hasOwnMeasure(propia) && heredada !== undefined

    const escribir = (cambio: (p: Record<string, unknown>) => void) =>
        write((p) => {
            materializeMeasure(p, naming, defaultUnit, legacy)
            cambio(p)
        })

    return {
        value: propia.value,
        unit: hereda ? heredada.unit : propia.unit,
        custom: propia.custom,
        placeholder: hereda ? measurePlaceholder(heredada) : undefined,
        exclude,
        onValueChange: (next: number | undefined) =>
            escribir((p) => {
                if (hereda) p[naming.unit(modo)] = heredada.unit
                p[naming.value(modo)] = next
            }),
        onUnitChange: (next: PropertyUnit) =>
            escribir((p) => {
                p[naming.unit(modo)] = next
            }),
        onCustomChange: (next: string) =>
            escribir((p) => {
                p[naming.custom(modo)] = next
            }),
    }
}
