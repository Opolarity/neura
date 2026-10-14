// El control de una propiedad de cuatro lados —el relleno, el margen— en el
// panel de propiedades.
//
// Pinta la etiqueta con el modo de pantalla activo, el desplegable de unidad, y
// debajo o bien un solo campo para los cuatro lados o bien los cuatro por
// separado. Toda la aritmetica de la cascada vive en box-measures; aqui solo
// queda lo que el usuario ve y toca.

import { useId, useState, type ComponentType } from "react"
import { Link2, Link2Off } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/shared/utils/utils"
import { ViewportIcon } from "@/modules/ecommerce/editor/components/responsive-field"
import type { Viewport } from "@/modules/ecommerce/editor/components/viewport-context"
import {
    PADDING_SIDES,
    type BoxSide,
    type SidesResolved,
} from "@/modules/ecommerce/editor/components/box-measures"
import {
    PropertyUnitSelect,
    type PropertyUnit,
} from "@/modules/ecommerce/editor/components/user-components/property-unit-select"

/** Una de las partes que edita el control: un lado o una esquina. */
export type SidePart<K extends string> = {
    side: K
    icon: ComponentType<{ className?: string }>
    label: string
    /** Giro del icono, para las esquinas, que reusan el mismo dibujo. */
    spin?: string
}

export function SidesField<K extends string = BoxSide>({
    label,
    viewport,
    parts = PADDING_SIDES as unknown as readonly SidePart<K>[],
    unit,
    custom,
    sides,
    inherited,
    inherits,
    exclude = ["auto"],
    customPlaceholder = "ej: 8px 16px",
    onUnitChange,
    onCustomChange,
    onSideChange,
    onAllChange,
}: {
    label: string
    viewport: Viewport
    /** Las partes a editar. Por defecto los cuatro lados. */
    parts?: readonly SidePart<K>[]
    /** La unidad del modo activo. Mientras hereda entero llega la heredada. */
    unit: PropertyUnit
    custom: string
    /** Las partes propias del modo activo. */
    sides: Partial<Record<K, number | undefined>>
    /** Lo que el modo aplicaria sin nada propio. */
    inherited?: SidesResolved<K>
    /** Si el modo activo no aporta ninguna parte y por tanto hereda entero. */
    inherits: boolean
    /** Unidades que no aplican a esta propiedad. */
    exclude?: PropertyUnit[]
    /** El ejemplo del campo de unidad libre. */
    customPlaceholder?: string
    onUnitChange: (next: PropertyUnit) => void
    onCustomChange: (next: string) => void
    /**
     * `adoptUnit` llega cuando el modo estaba heredando: es la unidad de lo que
     * heredaba, y hay que guardarla junto al numero. Sin esto, escribir un 10
     * sobre un escritorio medido en % lo guardaria en px, que es otra medida y
     * no la que se estaba viendo.
     */
    onSideChange: (
        side: K,
        value: number | undefined,
        adoptUnit?: PropertyUnit,
    ) => void
    onAllChange: (value: number | undefined, adoptUnit?: PropertyUnit) => void
}) {
    const fieldId = useId()
    // Arranca plegado, como las secciones del panel.
    const [split, setSplit] = useState(false)
    // Lo que se esta tecleando. Existe para poder dejar el campo a medias —al
    // escribir "1.5" se pasa por "1."— y para que lo que no sea un numero se
    // vea mientras se escribe: no se guarda, y al salir del campo vuelve lo que
    // habia.
    const [draft, setDraft] = useState<string | null>(null)

    const inheritedSide = (side: K) => inherited?.sides[side]

    // La unidad de lo heredado. Los cuatro lados pueden venir de modos
    // distintos, asi que solo hay una que enseñar si todos coinciden.
    const inheritedUnit = (() => {
        if (!inherits) return undefined
        const units = parts.map(({ side }) => inheritedSide(side)?.unit).filter(
            (value): value is PropertyUnit => value !== undefined,
        )
        if (units.length === 0) return undefined
        return units.every((value) => value === units[0]) ? units[0] : undefined
    })()

    // Cuatro lados iguales caben en un solo campo. En cuanto uno se separa, ese
    // campo ya no puede representarlos, y en vez de mentir con uno de los
    // cuatro lo dice: "Mezclado". Escribir un numero encima vuelve a igualarlos.
    //
    // Se compara lo propio, no lo que se acaba aplicando: un modo que hereda no
    // tiene nada suyo que enseñar, y lo heredado va de apoyo en gris.
    const same =
        new Set(parts.map(({ side }) => sides[side] ?? "")).size === 1

    // Lo que el modo aplicaria sin escribir nada: solo se puede resumir en un
    // campo si los cuatro lados heredados coinciden en numero y unidad.
    const inheritedShown = (() => {
        if (!inherits) return undefined
        const values = parts.map(({ side }) => inheritedSide(side))
        if (values.some((value) => value === undefined)) return undefined
        const first = values[0]!
        return values.every(
            (value) => value!.value === first.value && value!.unit === first.unit,
        )
            ? String(first.value)
            : undefined
    })()

    // Con las partes iguales, cualquiera representa a todas: se lee la primera.
    const primera = sides[parts[0].side]
    const shown =
        draft ?? (same ? (primera === undefined ? "" : String(primera)) : "Mezclado")

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
                <Label
                    htmlFor={fieldId}
                    className="text-[11px] text-foreground/80 flex items-center gap-1"
                >
                    {label}
                    <ViewportIcon viewport={viewport} className="h-3.5 w-3.5" />
                </Label>
                <PropertyUnitSelect
                    value={inherits && inheritedUnit ? inheritedUnit : unit}
                    onChange={onUnitChange}
                    // Cada propiedad recorta lo que no le vale. `padding: auto`
                    // no existe en CSS: el navegador lo descarta y el lado se
                    // queda en cero, asi que ofrecerlo seria prometer algo que
                    // no puede pasar.
                    exclude={exclude}
                />
            </div>

            {unit === "custom" ? (
                // Con la unidad libre hay un solo texto para los cuatro lados,
                // asi que no hay nada que separar y el boton de los lados sobra.
                <Input
                    id={fieldId}
                    className="h-8 text-[12px] md:text-[12px]"
                    type="text"
                    value={custom}
                    placeholder={customPlaceholder}
                    onChange={(e) => onCustomChange(e.target.value)}
                />
            ) : (
                <div className="flex items-start gap-2">
                    <div className="flex-1">
                        {split ? (
                            <div className="grid grid-cols-2 gap-2">
                                {parts.map(({ side, icon: SideIcon, label: sideLabel, spin }, index) => (
                                    <div key={side} className="relative">
                                        <SideIcon
                                            aria-hidden
                                            className={cn(
                                                "pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/50",
                                                spin,
                                            )}
                                        />
                                        <Input
                                            // Del <label> de arriba, que al
                                            // desplegarse los lados se queda sin
                                            // campo al que apuntar: pulsarlo
                                            // lleva al primero, que es donde
                                            // empieza a leerse.
                                            id={index === 0 ? fieldId : undefined}
                                            aria-label={sideLabel}
                                            title={sideLabel}
                                            className="h-8 pl-7 text-[12px] md:text-[12px]"
                                            type="number"
                                            min={0}
                                            step="any"
                                            value={sides[side] ?? ""}
                                            // El valor que este lado aplica sin
                                            // haber escrito nada aqui: el que
                                            // hereda del modo mayor.
                                            placeholder={
                                                inheritedSide(side) !== undefined
                                                    ? String(inheritedSide(side)!.value)
                                                    : "0"
                                            }
                                            onChange={(e) =>
                                                onSideChange(
                                                    side,
                                                    e.target.value === ""
                                                        ? undefined
                                                        : Number(e.target.value),
                                                    inherits
                                                        ? inheritedSide(side)?.unit
                                                        : undefined,
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Input
                                id={fieldId}
                                className="h-8 text-[12px] md:text-[12px]"
                                // Texto y no numero: con los cuatro lados
                                // distintos este campo dice "Mezclado", que un
                                // input numerico no puede mostrar. Lo que se
                                // teclee que no sea un numero no llega a
                                // guardarse y al salir del campo vuelve lo que
                                // habia.
                                type="text"
                                inputMode="decimal"
                                value={shown}
                                // Lo que el modo aplica sin nada propio, si los
                                // cuatro lados heredados coinciden. Si no
                                // coinciden no hay un numero que los resuma y el
                                // campo se queda con el cero.
                                placeholder={inheritedShown ?? "0"}
                                onChange={(e) => {
                                    const text = e.target.value
                                    setDraft(text)
                                    if (text === "") {
                                        onAllChange(undefined)
                                        return
                                    }
                                    const parsed = Number(text)
                                    if (Number.isNaN(parsed)) return
                                    onAllChange(
                                        parsed,
                                        inherits ? inheritedUnit : undefined,
                                    )
                                }}
                                onBlur={() => setDraft(null)}
                            />
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        title={
                            split
                                ? "Un solo valor para los cuatro lados"
                                : "Un valor por lado"
                        }
                        onClick={() => setSplit((open) => !open)}
                    >
                        {split ? (
                            <Link2Off className="h-3.5 w-3.5" />
                        ) : (
                            <Link2 className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
