/**
 * Comprueba que todos los bloques de una pagina guardada existan en el resolver
 * antes de entregarsela a <Frame>.
 *
 * Por que hace falta: craft.js trae un mensaje pensado justo para esto
 * ("Cannot find component <X /> in resolver map. Available components: ..."),
 * pero la guarda que deberia dispararlo comprueba lo que no es. En
 * @craftjs/core 0.2.12:
 *
 *     $(… e.resolvedName !== undefined, "Cannot find component …")  // pasa
 *     const { type, name, props } = Ve(e, t)                        // revienta
 *
 * El invariant solo verifica que el nodo *tenga* un `resolvedName`, cosa que
 * siempre cumple. Acto seguido `Ve` busca ese nombre en el resolver, no lo
 * encuentra, hace `return` a secas devolviendo undefined, y la linea siguiente
 * lo desestructura. Resultado: un
 *
 *     TypeError: Cannot destructure property 'type' of 'Ve(...)' as it is undefined
 *
 * que no dice que bloque falta ni en que pagina. El mensaje bueno es codigo
 * muerto. Esto lo sustituye por un error que si nombra al culpable, y que
 * ademas lleva los bloques como dato (no solo como texto) para que la pantalla
 * de error pueda listarlos.
 *
 * Ojo: esto NO recupera la pagina, solo explica la caida. Deserializar sigue
 * siendo lo que rompe el <Frame> entero.
 */

export type CraftResolver = Record<string, unknown>

export type BloqueDesconocido = {
    /** El `resolvedName` guardado en el JSON, p. ej. "EditableEjemplo" */
    nombre: string
    /** El nombre que veia quien edita, p. ej. "Ejemplo". No siempre esta guardado. */
    displayName?: string
    /** La clave del nodo dentro del JSON, util para localizarlo a mano */
    nodoId: string
}

/** craft resuelve este nombre contra su propio componente, nunca al resolver. */
const NOMBRES_PROPIOS = new Set(["Canvas"])

/**
 * Error de "la pagina usa bloques que ya no existen".
 *
 * Lleva los bloques en una propiedad ademas de en el mensaje: la pantalla de
 * error los necesita como lista para poder nombrarlos sin volver a parsear
 * texto. Se reconoce con `esErrorDeBloques()`, no con `instanceof`, que es
 * fragil cuando el modulo acaba en mas de un chunk.
 */
export class ErrorBloquesDesconocidos extends Error {
    readonly esErrorDeBloquesDesconocidos = true as const
    readonly bloques: BloqueDesconocido[]
    readonly origen: string

    constructor(bloques: BloqueDesconocido[], origen: string, mensaje: string) {
        super(mensaje)
        this.name = "ErrorBloquesDesconocidos"
        this.bloques = bloques
        this.origen = origen
    }
}

/** Reconoce el error sin depender de `instanceof`. */
export function esErrorDeBloques(valor: unknown): valor is ErrorBloquesDesconocidos {
    return (
        typeof valor === "object" &&
        valor !== null &&
        (valor as ErrorBloquesDesconocidos).esErrorDeBloquesDesconocidos === true &&
        Array.isArray((valor as ErrorBloquesDesconocidos).bloques)
    )
}

function esNodoSerializado(valor: unknown): valor is { resolvedName: string } {
    return (
        typeof valor === "object" &&
        valor !== null &&
        typeof (valor as { resolvedName?: unknown }).resolvedName === "string"
    )
}

function anotarSiFalta(
    nombre: string,
    resolver: CraftResolver,
    nodoId: string,
    displayName: string | undefined,
    fallos: BloqueDesconocido[]
): void {
    if (NOMBRES_PROPIOS.has(nombre)) return
    if (Object.prototype.hasOwnProperty.call(resolver, nombre)) return
    if (fallos.some((f) => f.nombre === nombre && f.nodoId === nodoId)) return
    fallos.push({ nombre, displayName, nodoId })
}

/**
 * Recorre un valor de prop en busca de elementos serializados anidados. craft
 * serializa dentro de las props cualquier React element (y las listas de
 * `children`), asi que un bloque desconocido puede estar escondido ahi y no
 * solo en el mapa de nodos de primer nivel.
 */
function recorrerProps(
    valor: unknown,
    resolver: CraftResolver,
    nodoId: string,
    fallos: BloqueDesconocido[],
    vistos: Set<object>
): void {
    if (typeof valor !== "object" || valor === null) return
    if (vistos.has(valor)) return
    vistos.add(valor)

    if (Array.isArray(valor)) {
        for (const item of valor) recorrerProps(item, resolver, nodoId, fallos, vistos)
        return
    }

    const tipo = (valor as { type?: unknown }).type
    if (esNodoSerializado(tipo)) {
        const dn = (valor as { displayName?: unknown }).displayName
        anotarSiFalta(
            tipo.resolvedName,
            resolver,
            nodoId,
            typeof dn === "string" ? dn : undefined,
            fallos
        )
    }

    for (const anidado of Object.values(valor as Record<string, unknown>)) {
        recorrerProps(anidado, resolver, nodoId, fallos, vistos)
    }
}

/**
 * Devuelve los bloques del JSON que el resolver no sabe pintar. Lista vacia =
 * la pagina se puede deserializar.
 *
 * Si el JSON no se puede leer devuelve lista vacia a proposito: ese es otro
 * problema y le toca a craft.js darlo, no queremos taparlo con un error
 * nuestro que despistaria.
 */
export function buscarBloquesDesconocidos(
    json: string | Record<string, unknown> | null | undefined,
    resolver: CraftResolver
): BloqueDesconocido[] {
    if (!json) return []

    let nodos: Record<string, unknown>
    try {
        nodos = typeof json === "string" ? JSON.parse(json) : json
    } catch {
        return []
    }
    if (typeof nodos !== "object" || nodos === null) return []

    const fallos: BloqueDesconocido[] = []

    for (const [nodoId, nodo] of Object.entries(nodos)) {
        if (typeof nodo !== "object" || nodo === null) continue

        const tipo = (nodo as { type?: unknown }).type
        // `type` puede ser un string ("div", "span"): eso no pasa por el resolver.
        if (esNodoSerializado(tipo)) {
            const dn = (nodo as { displayName?: unknown }).displayName
            anotarSiFalta(
                tipo.resolvedName,
                resolver,
                nodoId,
                typeof dn === "string" ? dn : undefined,
                fallos
            )
        }

        const props = (nodo as { props?: unknown }).props
        if (props) recorrerProps(props, resolver, nodoId, fallos, new Set())
    }

    return fallos
}

/** Nombre para enseñar a quien edita: el suyo si lo hay, si no el tecnico. */
export function etiquetaDeBloque(bloque: BloqueDesconocido): string {
    return bloque.displayName?.trim() || bloque.nombre
}

/**
 * El texto que se copia y se pega en el ticket de Tasks: la direccion de la
 * pagina y debajo un bloque por linea.
 *
 *     Ubicación: http://localhost:3000/editor/prueba
 *
 *     - Ejemplo (EditableEjemplo.tsx)
 *
 * Cuando el bloque no trae displayName no se repite el nombre dos veces: se
 * deja solo el archivo.
 */
export function textoParaTicket(bloques: BloqueDesconocido[], url: string): string {
    const lineas = bloques.map((b) => {
        const etiqueta = etiquetaDeBloque(b)
        const archivo = `${b.nombre}.tsx`
        return etiqueta === b.nombre ? `- ${archivo}` : `- ${etiqueta} (${archivo})`
    })

    return [`Ubicación: ${url}`, "", ...lineas].join("\n")
}

/**
 * Lanza un error que nombra los bloques que faltan, en lugar de dejar que
 * craft.js muera con un TypeError anonimo.
 *
 * El texto largo es el que acaba en consola y en el registro de RUM; la
 * pantalla de error usa la propiedad `bloques`, no este texto.
 *
 * @param origen De donde sale el <Frame>, para saber cual de los resolvers hay
 *               que tocar (hay uno por pantalla y no coinciden entre si).
 */
export function assertResolverCompleto(
    json: string | Record<string, unknown> | null | undefined,
    resolver: CraftResolver,
    origen: string
): void {
    const fallos = buscarBloquesDesconocidos(json, resolver)
    if (fallos.length === 0) return

    const registrados = Object.keys(resolver).sort()
    const lista = fallos
        .map((f) => {
            const alias = f.displayName && f.displayName !== f.nombre ? ` "${f.displayName}"` : ""
            return `  · ${f.nombre}${alias}  (nodo: ${f.nodoId})`
        })
        .join("\n")

    throw new ErrorBloquesDesconocidos(
        fallos,
        origen,
        [
            `[editor] No se puede pintar el contenido de «${origen}»: ` +
                `usa ${fallos.length} bloque${fallos.length === 1 ? "" : "s"} ` +
                `que no est${fallos.length === 1 ? "á" : "án"} en su resolver.`,
            "",
            lista,
            "",
            `Registrados en este resolver (${registrados.length}): ${registrados.join(", ")}`,
            "",
            "Cada pantalla tiene su propio resolver y no coinciden entre si. " +
                "Si el bloque existe en el editor pero no aqui, falta anadirlo a este archivo; " +
                "si el componente ya no existe, hay que quitar el bloque de la pagina.",
        ].join("\n")
    )
}
