// Las medidas de caja del editor: ancho, alto, relleno y margen.
//
// Todas se guardan por modo de pantalla (escritorio, tableta, celular) y con su
// unidad, y todas heredan del modo inmediatamente mayor cuando el suyo no trae
// nada. Ese calculo es identico en cada componente que las ofrezca, asi que vive
// aqui y no dentro de uno de ellos.
//
// Nacio dentro de editable-button.tsx, que fue el primero en tenerlas.

import {
    PanelTop,
    PanelRight,
    PanelBottom,
    PanelLeft,
    SquareRoundCorner,
} from "lucide-react"
import type { PropertyUnit } from "@/modules/ecommerce/editor/components/user-components/property-unit-select"

// ── Medidas de un solo valor: ancho y alto ──────────────────────────────────

export type MeasureSpec = {
    value: number | undefined
    unit: PropertyUnit
    custom: string
}

/**
 * Si el modo trae medida propia.
 *
 * "auto" cuenta como medida propia aunque no pinte nada: es la decision de que
 * ese modo no la lleve, no la ausencia de decision. Sin esto no se podria decir
 * "ancho fijo en escritorio y que en el celular lo ponga el contenido", porque
 * el celular heredaria el de escritorio.
 */
export function hasOwnMeasure({ value, unit, custom }: MeasureSpec) {
    if (unit === "auto") return true
    if (unit === "custom") return Boolean(custom)
    return value != null
}

/**
 * La cascada: cada modo usa el suyo y, si no lo tiene, el del modo
 * inmediatamente mayor. Definir el de escritorio basta para los tres.
 *
 * Se hereda el bloque entero y no solo el numero: heredar un 50 de un
 * escritorio medido en % y aplicarlo en px seria otra medida.
 */
export function resolveMeasureCascade(
    desktop: MeasureSpec,
    tablet: MeasureSpec,
    mobile: MeasureSpec,
) {
    const tabletValue = hasOwnMeasure(tablet) ? tablet : desktop
    return {
        desktop,
        tablet: tabletValue,
        mobile: hasOwnMeasure(mobile) ? mobile : tabletValue,
    }
}

/** Lo que el modo esta aplicando, para enseñarlo de apoyo en el campo vacio. */
export function measurePlaceholder({ value, unit, custom }: MeasureSpec) {
    if (unit === "auto") return "auto"
    if (unit === "custom") return custom || undefined
    return value != null ? String(value) : undefined
}

/**
 * La regla CSS de una medida de un solo valor.
 *
 * "auto" no emite regla, y por eso se resuelve aqui y no en el control de
 * unidades: `width: auto` es una regla como cualquier otra y pisaria la medida
 * que el bloque reciba de su contenedor, que es justo lo que la opcion promete
 * no tocar. Para el control basta con que sea una unidad mas.
 *
 * Ancho y alto comparten funcion porque comparten reglas: entre uno y otro solo
 * cambia el nombre de la propiedad.
 */
export function boxRule(
    property:
        | "width"
        | "height"
        | "min-width"
        | "max-width"
        | "min-height"
        | "max-height"
        // Las tipograficas se miden igual —un valor, una unidad, un texto
        // libre—, asi que reusan esta funcion en vez de repetirla. Ninguna
        // admite "auto", pero eso lo recorta el control, no la regla.
        | "font-size"
        | "line-height"
        | "letter-spacing",
    value: number | undefined,
    unit: PropertyUnit,
    custom: string,
) {
    if (unit === "auto") return ""
    if (unit === "custom") return custom ? `${property}: ${custom};` : ""
    return value != null ? `${property}: ${value}${unit};` : ""
}

// ── Como se llaman las props de una medida de un solo valor ─────────────────

/**
 * El ancho y el alto se guardan como `widthDesktop`, `widthUnitDesktop`,
 * `widthCustomDesktop`: un valor, una unidad y un texto libre por modo. Con el
 * nombrado fuera, la cascada, el panel y la migracion valen para las dos.
 */
export type MeasureNaming = {
    value: (mode: BoxMode) => string
    unit: (mode: BoxMode) => string
    custom: (mode: BoxMode) => string
}

const measureNaming = (
    property: "width" | "height" | "minWidth" | "maxWidth" | "minHeight" | "maxHeight",
): MeasureNaming => ({
    value: (mode) => `${property}${mode}`,
    unit: (mode) => `${property}Unit${mode}`,
    custom: (mode) => `${property}Custom${mode}`,
})

export const WIDTH_NAMING = measureNaming("width")
export const HEIGHT_NAMING = measureNaming("height")
export const MIN_WIDTH_NAMING = measureNaming("minWidth")
export const MAX_WIDTH_NAMING = measureNaming("maxWidth")
export const MIN_HEIGHT_NAMING = measureNaming("minHeight")
export const MAX_HEIGHT_NAMING = measureNaming("maxHeight")

/**
 * Lo que el bloque aplicaba antes de tener medidas por modo, por modo. Solo
 * hace falta rellenar los modos que tenian algo: un boton anterior a las
 * unidades tenia el celular al 100% y nada en los otros dos.
 */
export type MeasureLegacy = Partial<Record<"desktop" | "tablet" | "mobile", MeasureSpec>>

/** Si el bloque sigue en el formato anterior: ninguna unidad por modo guardada. */
export function isLegacyMeasure(props: Record<string, unknown>, naming: MeasureNaming) {
    return BOX_MODES.every((mode) => props[naming.unit(mode)] === undefined)
}

/** Lo que un modo tiene guardado de una medida. */
export function measureSpecOf(
    props: Record<string, unknown>,
    naming: MeasureNaming,
    mode: BoxMode,
    defaultUnit: PropertyUnit,
): MeasureSpec {
    return {
        value: props[naming.value(mode)] as number | undefined,
        unit: (props[naming.unit(mode)] as PropertyUnit | undefined) ?? defaultUnit,
        custom: (props[naming.custom(mode)] as string | undefined) ?? "",
    }
}

/**
 * La cascada ya resuelta de una medida. Mientras el bloque siga en el formato
 * anterior, cada modo con algo en `legacy` lo usa en lugar de lo guardado.
 */
export function measureCascadeOf(
    props: Record<string, unknown>,
    naming: MeasureNaming,
    defaultUnit: PropertyUnit,
    legacy?: MeasureLegacy,
) {
    const useLegacy = legacy !== undefined && isLegacyMeasure(props, naming)
    const of = (mode: BoxMode, key: keyof MeasureLegacy) =>
        useLegacy && legacy[key] ? legacy[key]! : measureSpecOf(props, naming, mode, defaultUnit)
    return resolveMeasureCascade(
        of("Desktop", "desktop"),
        of("Tablet", "tablet"),
        of("Mobile", "mobile"),
    )
}

/**
 * Saca a un bloque del formato anterior de una medida. Se llama antes de
 * cualquier escritura del panel: guardar una sola unidad por modo ya cuenta
 * como formato nuevo, y sin esto lo que valia "para los tres" se perderia al
 * tocar el desplegable de uno solo.
 */
export function materializeMeasure(
    props: Record<string, unknown>,
    naming: MeasureNaming,
    defaultUnit: PropertyUnit,
    legacy?: MeasureLegacy,
) {
    if (!isLegacyMeasure(props, naming)) return
    const modes: [BoxMode, keyof MeasureLegacy][] = [
        ["Desktop", "desktop"],
        ["Tablet", "tablet"],
        ["Mobile", "mobile"],
    ]
    for (const [mode, key] of modes) {
        const spec = legacy?.[key]
        props[naming.unit(mode)] = spec?.unit ?? defaultUnit
        // Lo del formato anterior pisa lo que hubiera bajo el mismo nombre: hay
        // bloques que guardaban `heightDesktop` como texto ("400px", "auto") y
        // ese texto no vale como numero.
        if (spec) {
            props[naming.value(mode)] = spec.value
            props[naming.custom(mode)] = spec.custom
        }
    }
}

// ── Medidas de cuatro lados: relleno y margen ───────────────────────────────

// Los cuatro lados, en el orden en que se leen en el panel. El icono dice a que
// lado pertenece cada campo: son cuatro numeros seguidos y sin nada que los
// distinga habria que ponerles una etiqueta a cada uno, que es justo el alto
// que este control trata de no ocupar.
//
// Se eligen los iconos de panel —la caja con un borde marcado— y no las flechas
// `ToLine`, que en el panel del boton ya significan la alineacion de su icono.
export const PADDING_SIDES = [
    { side: "Top", icon: PanelTop, label: "Arriba" },
    { side: "Right", icon: PanelRight, label: "Derecha" },
    { side: "Bottom", icon: PanelBottom, label: "Abajo" },
    { side: "Left", icon: PanelLeft, label: "Izquierda" },
] as const

/** El margen tiene los mismos cuatro lados que el relleno. */
export const MARGIN_SIDES = PADDING_SIDES

// Los tres modos de pantalla, en el orden en que se nombran las props.
export const BOX_MODES = ["Desktop", "Tablet", "Mobile"] as const

export type BoxSide = (typeof PADDING_SIDES)[number]["side"]
export type BoxMode = (typeof BOX_MODES)[number]

/** Las cuatro partes que recorre la cascada de una propiedad de lados. */
export const BOX_SIDE_KEYS = PADDING_SIDES.map(({ side }) => side)

/** El nombre CSS de cada lado. */
export const CSS_SIDE = {
    Top: "top",
    Right: "right",
    Bottom: "bottom",
    Left: "left",
} as const

/**
 * Lo que un modo tiene guardado de una propiedad de cuatro partes.
 *
 * Las partes van como parametro de tipo porque no siempre son lados: el radio
 * son esquinas. Por defecto son los lados, que es lo que usan el relleno, el
 * margen y el borde.
 */
export type SidesSpec<K extends string = BoxSide> = {
    sides: Partial<Record<K, number | undefined>>
    unit: PropertyUnit
    custom: string
}

/**
 * Lo que un modo acaba aplicando: el texto libre que le llegue, si lo hay, y
 * cada lado con la unidad del modo del que sale.
 *
 * El lado guarda su unidad y no la del modo que lo esta pintando porque la
 * herencia va lado a lado: la tableta puede tener un relleno lateral propio en
 * px y seguir heredando el de arriba de un escritorio medido en %. Emitirlos
 * con la unidad del modo cambiaria una medida que nadie pidio cambiar.
 */
export type SidesResolved<K extends string = BoxSide> = {
    custom: string
    sides: Partial<Record<K, { value: number; unit: PropertyUnit }>>
}

/**
 * Lo que este modo aporta por si mismo. `null` es no aportar nada —y entonces
 * hereda entero—, que es distinto de aportar cero lados.
 */
export function ownSidesOf<K extends string>(
    spec: SidesSpec<K>,
    parts: readonly K[],
): SidesResolved<K> | null {
    // Con la unidad libre el modo declara la propiedad de una vez y no hay
    // cuatro partes que repartir: o manda entero, o no aporta.
    if (spec.unit === "custom")
        return spec.custom ? { custom: spec.custom, sides: {} } : null
    const sides: SidesResolved<K>["sides"] = {}
    for (const part of parts) {
        const value = spec.sides[part]
        if (value != null) sides[part] = { value, unit: spec.unit }
    }
    return { custom: "", sides }
}

/**
 * La cascada, lado a lado: cada modo pisa del que hereda solo los lados que
 * trae, y los demas siguen al modo mayor. Bajar el relleno lateral en el
 * celular no obliga a repetir ahi el de arriba, y si mas adelante cambia el de
 * escritorio, los lados que nadie toco se actualizan con el.
 */
export function resolveSidesCascade<K extends string>(
    parts: readonly K[],
    desktop: SidesSpec<K>,
    tablet: SidesSpec<K>,
    mobile: SidesSpec<K>,
): {
    desktop: SidesResolved<K>
    tablet: SidesResolved<K>
    mobile: SidesResolved<K>
} {
    const merge = (
        parent: SidesResolved<K>,
        own: SidesResolved<K> | null,
    ): SidesResolved<K> => {
        if (own === null) return parent
        // Un texto libre propio declara la propiedad entera del modo, asi que
        // no deja nada que heredar.
        if (own.custom) return own
        return { custom: parent.custom, sides: { ...parent.sides, ...own.sides } }
    }
    // El tipo va escrito: sin el, el objeto vacio de arranque hace que
    // TypeScript deduzca unas partes vacias para toda la cascada.
    const desktopValue: SidesResolved<K> = ownSidesOf(desktop, parts) ?? {
        custom: "",
        sides: {},
    }
    const tabletValue = merge(desktopValue, ownSidesOf(tablet, parts))
    return {
        desktop: desktopValue,
        tablet: tabletValue,
        mobile: merge(tabletValue, ownSidesOf(mobile, parts)),
    }
}

/**
 * Las reglas CSS de una propiedad de cuatro lados.
 *
 * El texto libre va primero a proposito: es la forma corta y la pisan los lados
 * que vengan detras, que es justo lo que se quiere cuando un modo hereda un
 * "padding" de una linea y encima define un lado suyo.
 */
export function sidesRulesOf(
    property: "padding" | "margin",
    resolved: SidesResolved,
) {
    const { custom, sides } = resolved
    let rules = custom ? `${property}: ${custom};` : ""
    for (const { side } of PADDING_SIDES) {
        const value = sides[side]
        if (value)
            rules += `${property}-${CSS_SIDE[side]}: ${value.value}${value.unit};`
    }
    return rules
}

// ── El radio, que no tiene lados sino esquinas ──────────────────────────────

// Para las esquinas basta un icono: el cuadrado de esquina redondeada girado un
// cuarto de vuelta cada vez, como el editor ya hace con el icono de tableta en
// ResponsiveField.
//
// Sin girar, la esquina redondeada del icono cae arriba a la derecha, asi que
// esa es la que no lleva giro y las demas se cuentan desde ella.
//
// Van en orden de lectura y no en el del CSS: puestas en la rejilla de dos
// columnas, cada campo queda donde esta su esquina.
export const RADIUS_CORNERS = [
    {
        side: "TopLeft",
        icon: SquareRoundCorner,
        label: "Superior izquierda",
        spin: "-rotate-90",
    },
    {
        side: "TopRight",
        icon: SquareRoundCorner,
        label: "Superior derecha",
        spin: "",
    },
    {
        side: "BottomLeft",
        icon: SquareRoundCorner,
        label: "Inferior izquierda",
        spin: "rotate-180",
    },
    {
        side: "BottomRight",
        icon: SquareRoundCorner,
        label: "Inferior derecha",
        spin: "rotate-90",
    },
] as const

export type RadiusCorner = (typeof RADIUS_CORNERS)[number]["side"]

/** Las cuatro esquinas que recorre la cascada del radio. */
export const RADIUS_CORNER_KEYS = RADIUS_CORNERS.map(({ side }) => side)

/** El nombre CSS de cada esquina. */
export const CSS_CORNER = {
    TopLeft: "top-left",
    TopRight: "top-right",
    BottomLeft: "bottom-left",
    BottomRight: "bottom-right",
} as const

/**
 * Los trazos de borde que ofrece el panel, con su etiqueta. Son los cuatro que
 * se distinguen a simple vista; `groove`, `ridge` y compania dependen del color
 * y del navegador y no se ofrecen.
 */
export const BORDER_STYLES = [
    { value: "solid", label: "Continuo" },
    { value: "dashed", label: "Guiones" },
    { value: "dotted", label: "Punteado" },
    { value: "double", label: "Doble" },
] as const

export type BorderStyle = (typeof BORDER_STYLES)[number]["value"]

/**
 * El grosor de borde emite ademas su `border-style`, y lo decide sobre los
 * grosores ya resueltos: un modo que hereda 2px tiene que encender el borde, y
 * uno que ponga 0 tiene que poder apagar el que encendio otro. Por eso se emite
 * siempre, y no solo cuando hay borde.
 *
 * `style` es el trazo elegido en el panel; sin grosor no se pinta ninguno.
 *
 * Si el bloque no tiene ningun grosor definido —ni propio ni heredado— no
 * emite nada: asi el borde que el bloque traiga de su propia clase (la
 * variante `outline` de un boton, por ejemplo) se sigue viendo. Un 0 escrito
 * a proposito si cuenta como definido, y es lo que apaga el borde.
 */
export function borderRulesOf(
    { custom, sides }: SidesResolved,
    style: BorderStyle = "solid",
) {
    let rules = custom ? `border-width: ${custom};` : ""
    // Con la unidad libre no se puede comparar con cero: lo que decide es que
    // el texto diga algo.
    let hasBorder = Boolean(custom)
    let defined = Boolean(custom)
    for (const { side } of PADDING_SIDES) {
        const value = sides[side]
        if (!value) continue
        defined = true
        rules += `border-${CSS_SIDE[side]}-width: ${value.value}${value.unit};`
        if (value.value > 0) hasBorder = true
    }
    if (!defined) return ""
    return rules + `border-style: ${hasBorder ? style : "none"};`
}

/**
 * Como `sidesRulesOf`, pero el radio nombra sus longhands al reves: la parte va
 * en medio, entre `border` y `radius`.
 */
export function radiusRulesOf({ custom, sides }: SidesResolved<RadiusCorner>) {
    let rules = custom ? `border-radius: ${custom};` : ""
    for (const corner of RADIUS_CORNER_KEYS) {
        const value = sides[corner]
        if (value)
            rules += `border-${CSS_CORNER[corner]}-radius: ${value.value}${value.unit};`
    }
    return rules
}

// ── Como se llaman las props de cada propiedad ──────────────────────────────

/**
 * El relleno y el margen nombran sus props igual —`paddingTopDesktop`—, pero el
 * grosor de borde mete la parte en medio —`borderTopWidthDesktop`— y el radio
 * tambien. Con el nombrado fuera, la cascada y la migracion valen para las
 * cuatro sin repetirse.
 */
export type SidesNaming<K extends string> = {
    parts: readonly K[]
    value: (part: K, mode: BoxMode) => string
    legacyValue: (part: K) => string
    unit: (mode: BoxMode) => string
    custom: (mode: BoxMode) => string
    legacyUnit: string
    legacyCustom: string
}

const simpleNaming = (property: "padding" | "margin"): SidesNaming<BoxSide> => ({
    parts: BOX_SIDE_KEYS,
    value: (side, mode) => `${property}${side}${mode}`,
    legacyValue: (side) => `${property}${side}`,
    unit: (mode) => `${property}Unit${mode}`,
    custom: (mode) => `${property}Custom${mode}`,
    legacyUnit: `${property}Unit`,
    legacyCustom: `${property}Custom`,
})

export const PADDING_NAMING = simpleNaming("padding")
export const MARGIN_NAMING = simpleNaming("margin")

export const BORDER_WIDTH_NAMING: SidesNaming<BoxSide> = {
    parts: BOX_SIDE_KEYS,
    value: (side, mode) => `border${side}Width${mode}`,
    legacyValue: (side) => `border${side}Width`,
    unit: (mode) => `borderWidthUnit${mode}`,
    custom: (mode) => `borderWidthCustom${mode}`,
    legacyUnit: "borderWidthUnit",
    legacyCustom: "borderWidthCustom",
}

export const RADIUS_NAMING: SidesNaming<RadiusCorner> = {
    parts: RADIUS_CORNER_KEYS,
    value: (corner, mode) => `border${corner}Radius${mode}`,
    legacyValue: (corner) => `border${corner}Radius`,
    unit: (mode) => `borderRadiusUnit${mode}`,
    custom: (mode) => `borderRadiusCustom${mode}`,
    legacyUnit: "borderRadiusUnit",
    legacyCustom: "borderRadiusCustom",
}

/** Lo que un modo tiene guardado de una propiedad de partes. */
export function specOf<K extends string>(
    props: Record<string, unknown>,
    naming: SidesNaming<K>,
    mode: BoxMode,
): SidesSpec<K> {
    const sides = {} as Partial<Record<K, number | undefined>>
    for (const part of naming.parts)
        sides[part] = props[naming.value(part, mode)] as number | undefined
    return {
        sides,
        unit: (props[naming.unit(mode)] as PropertyUnit | undefined) ?? "px",
        custom: (props[naming.custom(mode)] as string | undefined) ?? "",
    }
}

/**
 * Si el componente sigue en el formato anterior de esta propiedad: que no haya
 * ni una unidad por modo guardada es la señal.
 */
export function isLegacySides<K extends string>(
    props: Record<string, unknown>,
    naming: SidesNaming<K>,
) {
    return BOX_MODES.every((mode) => props[naming.unit(mode)] === undefined)
}

/**
 * Lo que un bloque aplicaba antes de tener modos: un solo juego de lados —que
 * valia para los tres— o uno por modo, para los bloques que ya distinguian el
 * celular (la Seccion, con su relleno de escritorio y el de celular).
 */
export type SidesLegacy<K extends string = BoxSide> =
    | SidesSpec<K>
    | { desktop: SidesSpec<K>; tablet?: SidesSpec<K>; mobile?: SidesSpec<K> }

/** El juego de lados del formato anterior para un modo, si lo hay. */
export function legacySidesFor<K extends string>(
    legacy: SidesLegacy<K> | undefined,
    mode: BoxMode,
): SidesSpec<K> | undefined {
    if (!legacy) return undefined
    if ("sides" in legacy) return mode === "Desktop" ? legacy : undefined
    return mode === "Desktop" ? legacy.desktop : mode === "Tablet" ? legacy.tablet : legacy.mobile
}

/**
 * La cascada ya resuelta de una propiedad de partes.
 *
 * `legacy` es lo que el componente aplicaba antes de tener modos. Se usa en
 * lugar de lo guardado mientras siga en el formato anterior, que es lo que hace
 * que un bloque ya publicado se siga viendo igual.
 */
export function cascadeOf<K extends string>(
    props: Record<string, unknown>,
    naming: SidesNaming<K>,
    legacy?: SidesLegacy<K>,
) {
    const useLegacy = legacy !== undefined && isLegacySides(props, naming)
    const of = (mode: BoxMode) =>
        (useLegacy && legacySidesFor(legacy, mode)) || specOf(props, naming, mode)
    return resolveSidesCascade(naming.parts, of("Desktop"), of("Tablet"), of("Mobile"))
}

/**
 * Pasa un componente del relleno —o del margen— unico al de por modo de
 * pantalla.
 *
 * Se llama antes de cualquier escritura del panel, y no solo al elegir unidad:
 * mientras no haya una unidad por modo el componente se sigue leyendo del
 * formato viejo, asi que escribir un lado nuevo sin migrar primero no se veria
 * en el canvas.
 *
 * `legacySideValue` dice de donde sale el valor anterior de cada lado. Por
 * defecto lo busca en `padding${Lado}` / `margin${Lado}`, que es como lo guarda
 * el boton. Un componente que solo tuviera un numero para los cuatro lados pasa
 * el suyo aqui.
 */
export function materializeSidesWith<K extends string>(
    props: Record<string, unknown>,
    naming: SidesNaming<K>,
    legacyValueFor?: (part: K) => number | undefined,
    legacy?: SidesLegacy<K>,
) {
    if (!isLegacySides(props, naming)) return

    const unit = (props[naming.legacyUnit] as PropertyUnit | undefined) ?? "px"
    // La unidad si va a los tres modos: es lo que saca al componente del
    // formato anterior, y sin valores propios ninguno deja de heredar por
    // tenerla.
    for (const mode of BOX_MODES) props[naming.unit(mode)] = unit

    // El valor aterriza solo en el escritorio y los otros dos lo heredan de
    // ahi. Reproduce exactamente lo que hacia cuando era un valor unico para
    // todos los tamanos, y ademas deja la cascada viva: escribirlo en los tres
    // los dejaria fijados y cambiar el de escritorio ya no bajaria.
    props[naming.custom("Desktop")] = props[naming.legacyCustom] ?? ""
    for (const part of naming.parts) {
        const key = naming.value(part, "Desktop")
        if (props[key] === undefined)
            props[key] = legacyValueFor
                ? legacyValueFor(part)
                : props[naming.legacyValue(part)]
    }

    // Un bloque que ya distinguia modos en el formato anterior los conserva:
    // lo que tenia para el celular sigue siendo del celular.
    for (const mode of ["Tablet", "Mobile"] as const) {
        const spec = legacySidesFor(legacy, mode)
        if (!spec) continue
        props[naming.unit(mode)] = spec.unit
        props[naming.custom(mode)] = spec.custom
        for (const part of naming.parts) {
            const key = naming.value(part, mode)
            if (props[key] === undefined) props[key] = spec.sides[part]
        }
    }
}

/** `materializeSidesWith` para el relleno y el margen, que es el caso comun. */
export function materializeSides(
    props: Record<string, unknown>,
    property: "padding" | "margin",
    legacySideValue?: (side: BoxSide) => number | undefined,
) {
    materializeSidesWith(
        props,
        property === "padding" ? PADDING_NAMING : MARGIN_NAMING,
        legacySideValue,
    )
}
