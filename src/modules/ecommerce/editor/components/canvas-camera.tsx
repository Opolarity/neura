// Camara del canvas del editor: zoom y desplazamiento del viewport.
//
// Vive DELIBERADAMENTE fuera del estado de craft.js. Craft se ocupa de los nodos,
// la seleccion y el drag & drop; la camara solo decide como se mira la pagina. Por
// eso el zoom no se serializa con el contenido: es preferencia de quien edita, no
// parte de lo que se publica.
//
// El desplazamiento es SCROLL DE VERDAD, del navegador. El zoom es un
// transform: scale sobre el contenido, y como los transforms no ocupan sitio en
// el layout, hace falta un "medidor" con el tamaño real de la pagina escalada
// para que el navegador sepa cuanto hay que recorrer y dibuje sus barras:
//
//   viewport   overflow:auto, es quien scrollea y quien lleva las barras
//   └ medidor  ancho y alto reales de la pagina ya escalada, mas el margen
//     └ contenido  el que lleva el scale; se coloca para que la pagina caiga
//       └ pagina   donde vive craft
//
// Nada de esto pasa por React. El scroll lo lleva el DOM y el tamaño del medidor
// se escribe a mano; el estado de React solo guarda el zoom, y solo porque la
// barra de arriba pinta el porcentaje.

import {
    createContext,
    useCallback,
    useEffect,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
    type RefObject,
} from "react"

export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3

// Pasos del boton +/- y del menu de porcentajes.
export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3] as const

/**
 * Aire alrededor de la pagina, en pixeles de pantalla.
 *
 * Es a la vez el margen de los encuadres y el recorrido de scroll que sobra por
 * cada lado. Antes era un margen enorme (pantalla y media) porque no se veia:
 * solo servia para poder empujar la pagina fuera de la vista. Ahora ese margen
 * ES el rango de las barras de scroll, asi que si fuera tan grande las barras
 * dirian que hay muchisimo que recorrer cuando casi todo es vacio.
 *
 * Con este valor, a ancho completo no sobra nada en horizontal (no aparece barra
 * horizontal) y en cuanto se acerca el zoom, aparece.
 */
const MARGEN_LIENZO = 32

/**
 * Cuanto se mantiene la promocion a capa del compositor despues del ultimo
 * movimiento. Mientras dura, recorrer la pagina no la repinta: solo mueve una
 * textura ya rasterizada. Se quita al parar porque esa textura ocupa memoria de
 * video y la pagina del editor es grande.
 */
const MS_FIN_GESTO = 400

/**
 * Herramienta activa del canvas:
 * - "pointer": lo de siempre (seleccionar, editar, arrastrar componentes)
 * - "hand": solo mover la camara; el contenido no recibe el puntero
 *
 * Vive aqui, junto a la camara, porque es estado del lienzo y no del contenido:
 * tampoco se serializa con la pagina.
 */
export type CanvasTool = "pointer" | "hand"

/**
 * Las medidas que necesita la camara, tomadas fuera del gesto.
 *
 * `pageLeft`/`pageTop` son donde cae la pagina DENTRO del div del contenido. Se
 * miden en vez de calcularse porque el ancho de la pagina no siempre es un
 * numero de pixeles: el de un modal es texto libre y puede ser un porcentaje.
 * Midiendo, da igual como este escrito.
 *
 * `viewLeft`/`viewTop` son la posicion del viewport en la ventana: hacen falta
 * para pasar las coordenadas del raton a coordenadas del canvas sin llamar a
 * getBoundingClientRect en cada evento de rueda.
 */
interface Medidas {
    pageW: number
    pageH: number
    pageLeft: number
    pageTop: number
    viewW: number
    viewH: number
    viewLeft: number
    viewTop: number
}

/** Como queda repartido el lienzo para un zoom dado. */
interface Disposicion {
    /** Tamaño del medidor, o sea cuanto se puede recorrer. */
    anchoLienzo: number
    altoLienzo: number
    /** Donde va el div del contenido dentro del medidor. */
    izquierda: number
    arriba: number
}

interface CanvasCameraValue {
    /**
     * El zoom, para pintarlo. Se sincroniza una vez por frame, asi que durante un
     * gesto puede ir un frame por detras: para leer el valor exacto dentro de un
     * handler esta `getZoom()`.
     */
    zoom: number
    getZoom: () => number
    tool: CanvasTool
    setTool: (tool: CanvasTool) => void
    /** El marco que recorta y que scrollea. */
    viewportRef: RefObject<HTMLDivElement | null>
    /** El medidor: existe solo para darle tamaño al scroll. */
    sizerRef: RefObject<HTMLDivElement | null>
    /** El que lleva el scale. */
    contentRef: RefObject<HTMLDivElement | null>
    /** La pagina, para saber cuanto mide. */
    pageRef: RefObject<HTMLDivElement | null>
    /** true mientras se esta arrastrando la camara: cambia el cursor. */
    isPanning: boolean
    setIsPanning: (value: boolean) => void
    /**
     * Refresca las medidas cacheadas. Se llama al empezar un gesto: entre gestos
     * el panel lateral puede haberse plegado o la ventana haberse movido.
     */
    remeasure: () => void
    /** Zoom conservando bajo el cursor el punto que estaba ahi. */
    zoomAt: (clientX: number, clientY: number, nextZoom: number) => void
    /** Zoom desde el centro del viewport (botones y atajos). */
    zoomTo: (nextZoom: number) => void
    zoomIn: () => void
    zoomOut: () => void
    /** Vuelve al 100% y recentra. */
    reset: () => void
    /** La pagina entera a la vista, alto incluido. */
    fit: () => void
    /**
     * Mueve la vista. dx/dy son cuanto se mueve el CONTENIDO, o sea al reves que
     * el scroll: arrastrar hacia la derecha lleva la pagina a la derecha.
     */
    pan: (dx: number, dy: number) => void
}

const clampZoom = (z: number) => Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM)

const CanvasCameraContext = createContext<CanvasCameraValue | null>(null)

export function useCanvasCamera() {
    const ctx = useContext(CanvasCameraContext)
    if (!ctx) throw new Error("useCanvasCamera debe usarse dentro de CanvasCameraProvider")
    return ctx
}

export function CanvasCameraProvider({
    children,
    autoFit = false,
}: {
    children: ReactNode
    /**
     * Mientras sea true, cada medida vuelve a encuadrar la pagina por ancho; al
     * pasar a false la camara se queda donde este.
     *
     * Es true mientras se espera el contenido. En esos primeros frames el panel
     * izquierdo todavia se esta asentando, asi que el ancho del viewport cambia
     * y un encuadre unico saldria descentrado. Y se apaga al llegar el
     * contenido, no antes: a partir de ahi la pagina solo crece hacia abajo, que
     * es justo lo que el encuadre por ancho ignora, asi que la vista se queda
     * quieta y no hay salto.
     */
    autoFit?: boolean
}) {
    const [zoom, setZoomState] = useState(1)
    const [tool, setTool] = useState<CanvasTool>("pointer")
    const [isPanning, setIsPanning] = useState(false)

    const viewportRef = useRef<HTMLDivElement | null>(null)
    const sizerRef = useRef<HTMLDivElement | null>(null)
    const contentRef = useRef<HTMLDivElement | null>(null)
    const pageRef = useRef<HTMLDivElement | null>(null)

    // El zoom vigente. Es la fuente de verdad durante el gesto; el estado de
    // React va detras y solo sirve para pintar.
    const zoomRef = useRef(1)
    const medidasRef = useRef<Medidas>({
        pageW: 0,
        pageH: 0,
        pageLeft: 0,
        pageTop: 0,
        viewW: 0,
        viewH: 0,
        viewLeft: 0,
        viewTop: 0,
    })

    // El encuadre de apertura se hace una vez (ver `encuadrarSiToca`).
    const didInitialFit = useRef(false)
    const autoFitRef = useRef(autoFit)
    autoFitRef.current = autoFit

    const rafRef = useRef<number | null>(null)
    const finGestoRef = useRef<number | null>(null)

    const getZoom = useCallback(() => zoomRef.current, [])

    /**
     * Toma las medidas del viewport y de la pagina. Se llama siempre FUERA del
     * gesto (al montar, cuando algo cambia de tamaño y al empezar a mover), nunca
     * dentro: cada una de estas lecturas obliga al navegador a recalcular el
     * layout, y ese es exactamente el coste que el resto del archivo evita.
     */
    const remeasure = useCallback(() => {
        const viewport = viewportRef.current
        const page = pageRef.current
        if (!viewport || !page) return
        const rect = viewport.getBoundingClientRect()
        medidasRef.current = {
            pageW: page.offsetWidth,
            pageH: page.offsetHeight,
            // El div del contenido es el offsetParent de la pagina, asi que esto
            // es su hueco dentro de el, centrado o no.
            pageLeft: page.offsetLeft,
            pageTop: page.offsetTop,
            // clientWidth/Height ya descuentan las barras de scroll.
            viewW: viewport.clientWidth,
            viewH: viewport.clientHeight,
            viewLeft: rect.left,
            viewTop: rect.top,
        }
    }, [])

    /**
     * Cuanto ocupa el lienzo con este zoom y donde hay que poner el contenido
     * para que la pagina caiga centrada y con su margen arriba.
     *
     * El medidor nunca es menor que el viewport: si lo fuera, con la pagina
     * pequeña el contenido se iria a la esquina en vez de quedarse centrado.
     */
    const disposicion = useCallback((z: number): Disposicion => {
        const { pageW, pageH, pageLeft, pageTop, viewW, viewH } = medidasRef.current
        const anchoPagina = pageW * z
        const altoPagina = pageH * z

        const anchoLienzo = Math.max(viewW, anchoPagina + MARGEN_LIENZO * 2)
        const altoLienzo = Math.max(viewH, altoPagina + MARGEN_LIENZO * 2)

        // Donde queremos la pagina dentro del medidor...
        const paginaX = Math.max(MARGEN_LIENZO, (anchoLienzo - anchoPagina) / 2)
        const paginaY = MARGEN_LIENZO

        // ...y de ahi donde va el contenido, descontando el hueco que la pagina
        // ya tiene dentro de el (que tambien esta escalado).
        return {
            anchoLienzo,
            altoLienzo,
            izquierda: paginaX - pageLeft * z,
            arriba: paginaY - pageTop * z,
        }
    }, [])

    /** Escribe en el DOM el lienzo que corresponde a un zoom. */
    const escribirDisposicion = useCallback(
        (z: number) => {
            const sizer = sizerRef.current
            const content = contentRef.current
            if (!sizer || !content) return
            const { anchoLienzo, altoLienzo, izquierda, arriba } = disposicion(z)

            sizer.style.width = `${anchoLienzo}px`
            sizer.style.height = `${altoLienzo}px`
            content.style.left = `${izquierda}px`
            content.style.top = `${arriba}px`
            content.style.transform = `scale(${z})`
            // El mismo criterio que tenia el width:100% de antes: el ancho del
            // viewport, no el del contenido. Asi un ancho en porcentaje (los
            // modales lo permiten) se sigue resolviendo contra lo mismo que
            // antes, y no contra el medidor, que depende de la propia pagina.
            content.style.width = `${medidasRef.current.viewW}px`
        },
        [disposicion]
    )

    /**
     * Promociona el contenido a capa del compositor mientras dura el gesto y la
     * deja caer poco despues de parar. Sin esto, cada desplazamiento repinta la
     * tienda entera (textos, sombras, imagenes) en el hilo principal.
     */
    const marcarGesto = useCallback(() => {
        const el = contentRef.current
        if (!el) return
        if (finGestoRef.current === null) el.style.willChange = "transform"
        else window.clearTimeout(finGestoRef.current)
        finGestoRef.current = window.setTimeout(() => {
            finGestoRef.current = null
            const nodo = contentRef.current
            if (nodo) nodo.style.willChange = ""
        }, MS_FIN_GESTO)
    }, [])

    /** Lleva el zoom vigente al estado de React, una vez por frame. */
    const sincronizarZoom = useCallback(() => {
        if (rafRef.current !== null) return
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            setZoomState(zoomRef.current)
        })
    }, [])

    /**
     * Unico camino para cambiar el zoom. Escribe el lienzo nuevo y despues coloca
     * el scroll donde diga `scrollDestino`, que recibe el zoom ya aplicado.
     */
    const aplicarZoom = useCallback(
        (
            nextZoom: number,
            scrollDestino?: (z: number, d: Disposicion) => { x: number; y: number }
        ) => {
            const viewport = viewportRef.current
            if (!viewport) return
            const z = clampZoom(nextZoom)

            zoomRef.current = z
            escribirDisposicion(z)
            marcarGesto()

            if (scrollDestino) {
                // Leer el recorrido obliga al navegador a recalcular el layout, y
                // aqui hace falta: el medidor acaba de cambiar de tamaño y sin
                // esto recortaria el scroll contra el rango viejo, que al acercar
                // el zoom es mas corto. Es el unico sitio del archivo donde se
                // mide a proposito dentro de un gesto.
                //
                // Y de paso se recorta a mano con lo leido, en vez de dejar un
                // acceso suelto que un minificador podria dar por inutil.
                const maxX = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
                const maxY = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
                const destino = scrollDestino(z, disposicion(z))
                viewport.scrollLeft = Math.min(Math.max(destino.x, 0), maxX)
                viewport.scrollTop = Math.min(Math.max(destino.y, 0), maxY)
            }

            sincronizarZoom()
        },
        [disposicion, escribirDisposicion, marcarGesto, sincronizarZoom]
    )

    /**
     * Zoom conservando bajo el cursor el punto que estaba ahi.
     *
     * Un punto `c` del contenido cae dentro del medidor en `izquierda + c * z`, y
     * en pantalla en eso menos el scroll. Para que no se mueva hay que recolocar
     * el scroll: scroll' = izquierda' + c * z' - posicionEnPantalla.
     */
    const zoomAt = useCallback(
        (clientX: number, clientY: number, nextZoom: number) => {
            const viewport = viewportRef.current
            if (!viewport) return
            const { viewLeft, viewTop } = medidasRef.current
            const px = clientX - viewLeft
            const py = clientY - viewTop

            const zAnterior = zoomRef.current
            const anterior = disposicion(zAnterior)
            const cx = (viewport.scrollLeft + px - anterior.izquierda) / zAnterior
            const cy = (viewport.scrollTop + py - anterior.arriba) / zAnterior

            aplicarZoom(nextZoom, (z, d) => ({
                x: cx * z + d.izquierda - px,
                y: cy * z + d.arriba - py,
            }))
        },
        [aplicarZoom, disposicion]
    )

    const zoomTo = useCallback(
        (nextZoom: number) => {
            // Viene de un boton o de un atajo, no de un gesto continuo: aqui si
            // conviene medir, porque entre una pulsacion y otra el panel lateral
            // puede haberse movido.
            remeasure()
            const { viewLeft, viewTop, viewW, viewH } = medidasRef.current
            zoomAt(viewLeft + viewW / 2, viewTop + viewH / 2, nextZoom)
        },
        [remeasure, zoomAt]
    )

    const zoomIn = useCallback(() => {
        const next = ZOOM_STEPS.find((s) => s > zoomRef.current + 0.001) ?? MAX_ZOOM
        zoomTo(next)
    }, [zoomTo])

    const zoomOut = useCallback(() => {
        const actual = zoomRef.current
        const next = [...ZOOM_STEPS].reverse().find((s) => s < actual - 0.001) ?? MIN_ZOOM
        zoomTo(next)
    }, [zoomTo])

    /** Pone la pagina centrada y arriba del todo, al zoom que se le pase. */
    const encuadrar = useCallback(
        (z: number) => {
            aplicarZoom(z, (_, d) => ({
                x: (d.anchoLienzo - medidasRef.current.viewW) / 2,
                y: 0,
            }))
        },
        [aplicarZoom]
    )

    /**
     * Encuadre por ancho: la pagina ocupa el ancho disponible y el alto queda
     * libre, se salga o no de la vista.
     *
     * Es el encuadre de apertura. Solo depende del ancho, que es uno de los tres
     * de VIEWPORT_WIDTHS y se conoce desde el primer frame; el contenido solo
     * aporta alto, asi que cuando llega no hay nada que recalcular y la vista no
     * se mueve.
     */
    const fitWidth = useCallback(() => {
        remeasure()
        const { pageW, viewW } = medidasRef.current
        if (pageW <= 0) return
        encuadrar(clampZoom(Math.min((viewW - MARGEN_LIENZO * 2) / pageW, 1)))
    }, [encuadrar, remeasure])

    /**
     * Encuadre completo: la pagina entera a la vista, alto incluido. Es lo que
     * hace "Ajustar a la pantalla", que se pide a mano y donde ver la pagina de
     * punta a punta es justo lo que se busca.
     */
    const fit = useCallback(() => {
        remeasure()
        const { pageW, pageH, viewW, viewH } = medidasRef.current
        if (pageW <= 0 || pageH <= 0) return
        encuadrar(
            clampZoom(
                Math.min(
                    (viewW - MARGEN_LIENZO * 2) / pageW,
                    (viewH - MARGEN_LIENZO * 2) / pageH,
                    1
                )
            )
        )
    }, [encuadrar, remeasure])

    const reset = useCallback(() => {
        remeasure()
        encuadrar(1)
    }, [encuadrar, remeasure])

    /**
     * Mover la vista es mover el scroll, y al reves: llevar el contenido a la
     * derecha es scrollear hacia la izquierda.
     *
     * Leer scrollLeft aqui no cuesta un recalculo: durante un arrastre lo unico
     * que cambia es la propia posicion del scroll, que no invalida el layout.
     */
    const pan = useCallback((dx: number, dy: number) => {
        const viewport = viewportRef.current
        if (!viewport) return
        viewport.scrollLeft -= dx
        viewport.scrollTop -= dy
        marcarGesto()
    }, [marcarGesto])

    /**
     * El encuadre de apertura.
     *
     * El primero siempre se hace; a partir de ahi solo mientras `autoFit` siga
     * puesto, o sea mientras se espera el contenido. Despues no se repite nunca:
     * si se rehiciera al cambiar el tamaño de la pagina, editar moveria la vista
     * sin que nadie lo pida.
     *
     * Devuelve si lo hizo, para que quien lo llama sepa si ya coloco la vista.
     */
    const encuadrarSiToca = useCallback(() => {
        if (didInitialFit.current && !autoFitRef.current) return false
        remeasure()
        if (medidasRef.current.pageW <= 0) return false
        didInitialFit.current = true
        fitWidth()
        return true
    }, [fitWidth, remeasure])

    // Primera medida y lienzo inicial.
    useEffect(() => {
        remeasure()
        escribirDisposicion(zoomRef.current)
    }, [escribirDisposicion, remeasure])

    // El medidor tiene que seguir a la pagina: su tamaño es lo que le dice al
    // navegador cuanto hay que recorrer, y la pagina crece y mengua sola (al
    // llegar el contenido, al editarlo, al pasar de escritorio a movil).
    useEffect(() => {
        const page = pageRef.current
        const viewport = viewportRef.current
        if (!page || !viewport || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(() => {
            // El callback corre despues del layout, asi que medir aqui no cuesta
            // un recalculo extra: es el sitio barato para hacerlo.
            remeasure()

            // Al abrir, la pagina se encuadra sola: observe() dispara una
            // primera medida en cuanto hay algo que medir.
            if (encuadrarSiToca()) return

            escribirDisposicion(zoomRef.current)
        })
        observer.observe(page)
        observer.observe(viewport)
        return () => observer.disconnect()
    }, [encuadrarSiToca, escribirDisposicion, remeasure])

    // Al cambiar el tamaño de la ventana el viewport puede moverse sin cambiar de
    // caja, y las coordenadas del raton se convierten con viewLeft/viewTop. Lo
    // demas que lo mueve (plegar el panel lateral, arrastrar el tirador) si le
    // cambia el ancho, y de eso ya se entera el ResizeObserver de arriba.
    useEffect(() => {
        const alCambiar = () => remeasure()
        window.addEventListener("resize", alCambiar)
        return () => window.removeEventListener("resize", alCambiar)
    }, [remeasure])

    useEffect(
        () => () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            if (finGestoRef.current !== null) window.clearTimeout(finGestoRef.current)
        },
        []
    )

    const value = useMemo<CanvasCameraValue>(
        () => ({
            zoom,
            getZoom,
            tool,
            setTool,
            viewportRef,
            sizerRef,
            contentRef,
            pageRef,
            isPanning,
            setIsPanning,
            remeasure,
            zoomAt,
            zoomTo,
            zoomIn,
            zoomOut,
            reset,
            fit,
            pan,
        }),
        [
            zoom,
            getZoom,
            tool,
            isPanning,
            remeasure,
            zoomAt,
            zoomTo,
            zoomIn,
            zoomOut,
            reset,
            fit,
            pan,
        ]
    )

    return <CanvasCameraContext.Provider value={value}>{children}</CanvasCameraContext.Provider>
}
