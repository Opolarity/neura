// Seleccion multiple del panel de capas: ctrl para sumar sueltas, shift para
// un rango, y Delete para borrar lo seleccionado.
//
// El core de craft trae su propia seleccion multiple, y el connector "layer" de
// @craftjs/layers hereda ese handler, asi que en teoria bastaba con cambiarle
// isMultiSelectEnabled. En el canvas funciona; en el arbol de capas no, de modo
// que aqui la seleccion con modificador se resuelve entera por nuestra cuenta y
// al core se le cortan sus dos eventos (mousedown y click).
//
// El <Editor> conserva igualmente isMultiSelectEnabled con ctrl: es lo que hace
// que el canvas responda a la misma tecla que el panel.

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useSyncExternalStore,
    type ReactNode,
} from "react"
import { useEditor } from "@craftjs/core"
import { toast } from "sonner"
import { isTypingTarget } from "./canvas-viewport"
import {
    copyNodesToClipboard,
    getEditorClipboardServerSnapshot,
    getEditorClipboardSnapshot,
    pasteFromClipboard,
    subscribeEditorClipboard,
} from "@/modules/ecommerce/editor/lib/editor-clipboard"

// Cada fila del arbol se marca con este atributo. El orden de los nodos en el
// DOM es exactamente el orden visual del panel (una capa colapsada no renderiza
// a sus hijos), que es lo que hace falta para resolver un rango sin depender
// del estado interno de @craftjs/layers.
export const LAYER_ID_ATTR = "data-layer-id"

interface LayersSelectionValue {
    onLayerMouseDown: (id: string, e: React.MouseEvent) => void
    // El core selecciona en mousedown Y en click. Cortar solo el mousedown no
    // basta: en el click, al ver mas de un nodo seleccionado sin el modificador
    // que el conoce, colapsa la seleccion a uno solo y deshace el rango.
    onLayerClick: (e: React.MouseEvent) => void
    listRef: (dom: HTMLElement | null) => void
    // Copiar/pegar entre paginas, via localStorage (ver lib/editor-clipboard).
    // Sin ids: copian lo seleccionado, pegan respecto a lo seleccionado. Los
    // botones de cada capa seleccionan primero y luego llaman a esto.
    copySelection: () => void
    pasteClipboard: () => void
    // true cuando hay algo en el portapapeles, en esta pestaña o en otra.
    hasClipboard: boolean
}

const LayersSelectionContext = createContext<LayersSelectionValue | null>(null)

export function useLayersSelection() {
    return useContext(LayersSelectionContext)
}

export function LayersSelectionProvider({ children }: { children: ReactNode }) {
    const { actions, query } = useEditor()

    // Ancla del rango: la ultima capa clicada sin shift.
    const anchor = useRef<string | null>(null)
    const list = useRef<HTMLElement | null>(null)

    const listRef = useCallback((dom: HTMLElement | null) => {
        list.current = dom
    }, [])

    const visualOrder = useCallback(() => {
        const root = list.current
        if (!root) return [] as string[]
        return Array.from(root.querySelectorAll(`[${LAYER_ID_ATTR}]`))
            .map((el) => el.getAttribute(LAYER_ID_ATTR))
            .filter((id): id is string => Boolean(id))
    }, [])

    const onLayerMouseDown = useCallback(
        (id: string, e: React.MouseEvent) => {
            const additive = e.ctrlKey || e.metaKey
            const range = e.shiftKey

            if (!additive && !range) {
                // Clic normal: lo resuelve el core. Aqui solo se apunta el ancla
                // desde la que medira el siguiente shift.
                anchor.current = id
                return
            }

            // El core resuelve la seleccion en mousedown Y en click, y en el
            // click colapsa a un solo nodo lo que no venga de su propio
            // modificador. Con cualquier modificador se le cortan los dos y la
            // seleccion la decidimos entera aqui.
            e.preventDefault()
            e.stopPropagation()

            const current = query.getEvent("selected").all()

            if (range) {
                const order = visualOrder()
                const from = anchor.current ? order.indexOf(anchor.current) : -1
                const to = order.indexOf(id)

                if (from !== -1 && to !== -1) {
                    const [start, end] = from < to ? [from, to] : [to, from]
                    const slice = order.slice(start, end + 1)
                    // Ctrl+Shift suma el rango a lo ya seleccionado; shift solo
                    // lo reemplaza. El ancla no se mueve, para poder estirar y
                    // encoger el rango desde el mismo punto.
                    actions.selectNode(
                        additive
                            ? Array.from(new Set([...current, ...slice]))
                            : slice
                    )
                    return
                }

                // Sin ancla utilizable no hay rango: queda como seleccion suelta.
                anchor.current = id
                actions.selectNode(id)
                return
            }

            // Ctrl: alterna esta capa dentro de la seleccion. A diferencia del
            // core, se admite tener a la vez un contenedor y algo de dentro.
            anchor.current = id
            actions.selectNode(
                current.includes(id)
                    ? current.filter((selectedId) => selectedId !== id)
                    : [...current, id]
            )
        },
        [actions, query, visualOrder]
    )

    const onLayerClick = useCallback((e: React.MouseEvent) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) e.stopPropagation()
    }, [])

    // ── Copiar y pegar ──────────────────────────────────────────────────────
    // El portapapeles vive en localStorage para que un componente copiado en
    // una pestaña se pueda pegar en otra pagina abierta en otra pestaña.
    const hasClipboard =
        useSyncExternalStore(
            subscribeEditorClipboard,
            getEditorClipboardSnapshot,
            getEditorClipboardServerSnapshot
        ) > 0

    const copySelection = useCallback(() => {
        const selected = query.getEvent("selected").all()
        const count = copyNodesToClipboard(query, selected)
        if (count === 0) {
            // La raiz (Pagina/Modal) no se copia: no hay donde pegarla.
            toast.error("Selecciona un componente para copiarlo")
            return
        }
        toast.success(
            count === 1 ? "Componente copiado" : `${count} componentes copiados`
        )
    }, [query])

    const pasteClipboard = useCallback(() => {
        const selected = query.getEvent("selected").all()
        // Una sola llamada a addNodeTree por arbol, pero todas seguidas: craft
        // guarda un juego de parches por accion, asi que deshacer las quita de
        // una en una. Es el mismo comportamiento que soltar varias veces.
        const outcome = pasteFromClipboard(query, actions.addNodeTree, selected)
        switch (outcome.status) {
            case "ok":
                // Se selecciona lo pegado, como al soltar un componente nuevo,
                // para que se vea donde cayo y pueda seguirse pegando debajo.
                actions.selectNode(outcome.rootIds)
                toast.success(
                    outcome.count === 1
                        ? "Componente pegado"
                        : `${outcome.count} componentes pegados`
                )
                return
            case "empty":
                toast.error("No hay nada copiado")
                return
            case "rejected":
                toast.error("Este contenedor no admite el componente copiado")
                return
            case "error":
                toast.error("No se pudo pegar: el componente copiado no es válido")
                return
        }
    }, [actions, query])

    // Ctrl+C copia lo seleccionado y Ctrl+V lo pega. En Mac valen con Cmd.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
            const tecla = e.key.toLowerCase()
            if (tecla !== "c" && tecla !== "v") return
            // No mientras se escribe: ahi Ctrl+C/V son los del texto.
            if (isTypingTarget(e.target)) return
            // Con texto marcado en la pagina, Ctrl+C sigue siendo copiar texto.
            if (tecla === "c" && (window.getSelection()?.toString() ?? "") !== "") return

            e.preventDefault()
            if (tecla === "c") copySelection()
            else pasteClipboard()
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [copySelection, pasteClipboard])

    // Delete borra de una vez todas las capas seleccionadas. Va en una sola
    // llamada a proposito: craft guarda un juego de parches por accion, asi que
    // un unico deshacer las recupera todas en lugar de una por una.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Las dos teclas de borrar: Supr y Retroceso. En los teclados de
            // portatil no siempre hay Supr, y "borrar" se pulsa con Retroceso.
            if (e.key !== "Delete" && e.key !== "Backspace") return
            // No mientras se escribe: el nombre de una capa se renombra en el
            // propio arbol, y los paneles estan llenos de campos de texto.
            if (isTypingTarget(e.target)) return

            // Se corta aunque no haya nada que borrar: fuera de un campo de
            // texto, Retroceso llega a significar "atras" en el navegador, y
            // salir del editor por accidente costaria el trabajo sin guardar.
            e.preventDefault()

            const selected = query.getEvent("selected").all()
            // isDeletable() es !isTopLevelNode(), asi que deja fuera la raiz: la
            // Pagina (o el Modal) no se borra desde aqui.
            const deletable = selected
                .filter((id) => query.node(id).isDeletable())
                // Y fuera lo que ya se lleva por delante un ancestro suyo que
                // tambien esta seleccionado: craft resuelve la lista una sola
                // vez y luego va borrando, asi que al llegar al hijo el nodo ya
                // no existiria y su invariante reventaria.
                .filter((id) => {
                    const ancestors = query.node(id).ancestors(true)
                    return !selected.some((other) => ancestors.includes(other))
                })
            if (deletable.length === 0) return

            actions.delete(deletable)
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [actions, query])

    return (
        <LayersSelectionContext.Provider
            value={{
                onLayerMouseDown,
                onLayerClick,
                listRef,
                copySelection,
                pasteClipboard,
                hasClipboard,
            }}
        >
            {children}
        </LayersSelectionContext.Provider>
    )
}
