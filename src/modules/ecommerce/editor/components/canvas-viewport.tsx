// El viewport: el marco que recorta, desde el que se mira la pagina y que lleva
// las barras de scroll.
//
// Las barras las pone ScrollArea (Radix). El scroll sigue siendo nativo y sigue
// siendo el mismo elemento el que scrollea y el que contiene, que es lo que
// mantiene la vista pegada al gesto; lo que cambia es que las barras ya no son
// las del sistema, sino las del proyecto. Por eso la camara necesita el
// viewport de DENTRO del ScrollArea, y no su Root: ver `viewportRef` abajo.
//
// Los gestos siguen la convencion de las herramientas de diseño:
//   Ctrl/Cmd + rueda   zoom sobre el cursor
//   rueda              desplazar (vertical, y horizontal en trackpad)
//   Espacio + arrastrar  desplazar
//   boton central + arrastrar  desplazar
//   Ctrl/Cmd + 0 / + / -  100%, acercar, alejar
//   V / H              herramienta puntero / mover
//
// ...y ademas las barras, que se arrastran como en cualquier sitio.

import { useEffect, useRef, type ReactNode } from "react"
import { useEditor } from "@craftjs/core"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCanvasCamera } from "./canvas-camera"

/** Cuanto vale una "linea" de rueda en pixeles. Ver `deltaEnPixeles`. */
const PX_POR_LINEA = 16

/**
 * La rueda no siempre habla en pixeles: hay navegadores y ratones que mandan
 * lineas (Firefox manda 3 por muesca) o paginas enteras. Sin traducirlo, una
 * muesca movia 3px en vez de 48.
 */
function deltaEnPixeles(e: WheelEvent, viewport: HTMLElement) {
    if (e.deltaMode === 1) {
        return { x: e.deltaX * PX_POR_LINEA, y: e.deltaY * PX_POR_LINEA }
    }
    if (e.deltaMode === 2) {
        // Practicamente no pasa; medir aqui no penaliza el caso normal.
        return { x: e.deltaX * viewport.clientWidth, y: e.deltaY * viewport.clientHeight }
    }
    return { x: e.deltaX, y: e.deltaY }
}

/**
 * Los atajos del canvas no deben dispararse mientras se escribe: la V y la H son
 * letras normales dentro de un campo, y la barra espaciadora es un espacio.
 */
export function isTypingTarget(target: EventTarget | null) {
    const el = target as HTMLElement | null
    if (!el) return false
    const tag = el.tagName
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
}

/**
 * La pagina dentro del viewport. Se registra en la camara para que pueda medirla;
 * por lo demas es un div normal y conserva las clases y el estilo que se le pasen.
 */
export function CanvasPage({
    className,
    style,
    children,
}: {
    className?: string
    style?: React.CSSProperties
    children: ReactNode
}) {
    const { pageRef } = useCanvasCamera()
    return (
        <div ref={pageRef} className={className} style={style}>
            {children}
        </div>
    )
}

export function CanvasViewport({
    children,
    inert = false,
}: {
    children: ReactNode
    /**
     * Deja el contenido sin puntero sin tocar la camara: la pagina se ve y se
     * puede recorrer, pero no se selecciona nada ni se puede soltar un
     * componente encima.
     *
     * Lo usa la espera del contenido. Es el mismo trato que recibe el canvas con
     * la herramienta Mano activa, solo que por otro motivo.
     */
    inert?: boolean
}) {
    const { actions } = useEditor()
    const {
        getZoom,
        tool,
        setTool,
        pageRef,
        viewportRef,
        sizerRef,
        contentRef,
        isPanning,
        setIsPanning,
        remeasure,
        zoomAt,
        zoomIn,
        zoomOut,
        reset,
        pan,
    } = useCanvasCamera()

    // Con la mano activa el contenido no recibe el puntero: no se selecciona, no se
    // edita texto y no se puede soltar un componente desde la barra lateral.
    const handMode = tool === "hand"

    // Los tres casos en que el contenido no recibe el puntero. La camara sigue
    // funcionando en todos: lo que se apaga es el contenido, no el lienzo.
    const contenidoInerte = isPanning || handMode || inert

    // La barra espaciadora arma el pan; se guarda en ref para que los listeners
    // nativos lean el valor vigente sin volver a suscribirse.
    const spaceHeld = useRef(false)
    const dragging = useRef<{ x: number; y: number } | null>(null)

    // La rueda va como listener nativo no pasivo: React los registra como pasivos
    // y ahi preventDefault() no surte efecto.
    //
    // Se registra una sola vez: el zoom vigente se lee con getZoom() en vez de
    // venir por props.
    const ultimaRueda = useRef(0)
    useEffect(() => {
        const el = viewportRef.current
        if (!el) return

        const onWheel = (e: WheelEvent) => {
            // Una rafaga de rueda son muchos eventos seguidos; solo al empezar una
            // nueva se vuelven a tomar las medidas, que es cuando pueden haber
            // cambiado (panel plegado, ventana movida).
            const ahora = e.timeStamp
            if (ahora - ultimaRueda.current > 200) remeasure()
            ultimaRueda.current = ahora

            // Siempre se la queda el canvas. Sin esto, la rueda sobre algo con
            // scroll propio dentro de la pagina (un carrusel, un bloque con
            // overflow) movería eso en vez del lienzo, y aqui se esta editando o
            // previsualizando la pagina, no usandola.
            e.preventDefault()

            const { x, y } = deltaEnPixeles(e, el)

            if (e.ctrlKey || e.metaKey) {
                // deltaY negativo al girar hacia arriba: acercar.
                zoomAt(e.clientX, e.clientY, getZoom() * (1 - y * 0.0015))
                return
            }
            pan(-x, -y)
        }

        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [getZoom, pan, remeasure, viewportRef, zoomAt])

    // Atajos de teclado y estado de la barra espaciadora.
    useEffect(() => {
        const isTyping = isTypingTarget

        const onKeyDown = (e: KeyboardEvent) => {
            // V / H cambian de herramienta. Sin modificadores, para no pisar
            // Ctrl+V ni los atajos del navegador.
            if (!e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
                if (e.key === "v" || e.key === "V") {
                    e.preventDefault()
                    setTool("pointer")
                    return
                }
                if (e.key === "h" || e.key === "H") {
                    e.preventDefault()
                    setTool("hand")
                    return
                }
            }
            if (e.code === "Space" && !isTyping(e.target)) {
                if (!spaceHeld.current) spaceHeld.current = true
                // Evita que la pagina haga scroll con la barra espaciadora.
                e.preventDefault()
                return
            }
            if (!(e.ctrlKey || e.metaKey) || isTyping(e.target)) return
            if (e.key === "0") {
                e.preventDefault()
                reset()
            } else if (e.key === "+" || e.key === "=") {
                e.preventDefault()
                zoomIn()
            } else if (e.key === "-") {
                e.preventDefault()
                zoomOut()
            }
        }

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                spaceHeld.current = false
                if (!dragging.current) setIsPanning(false)
            }
        }

        // Si la ventana pierde el foco con la barra pulsada, el gesto quedaria armado.
        const onBlur = () => {
            spaceHeld.current = false
            dragging.current = null
            setIsPanning(false)
        }

        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        window.addEventListener("blur", onBlur)
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
            window.removeEventListener("blur", onBlur)
        }
    }, [reset, setIsPanning, setTool, zoomIn, zoomOut])

    // Arrastre de la camara. Se sigue con listeners en window para que el gesto no
    // se corte al salir el puntero del viewport.
    useEffect(() => {
        if (!dragging.current) return
        const onMove = (e: MouseEvent) => {
            const from = dragging.current
            if (!from) return
            pan(e.clientX - from.x, e.clientY - from.y)
            dragging.current = { x: e.clientX, y: e.clientY }
        }
        const onUp = () => {
            dragging.current = null
            if (!spaceHeld.current) setIsPanning(false)
        }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onUp)
        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", onUp)
        }
    }, [isPanning, pan, setIsPanning])

    const onMouseDown = (e: React.MouseEvent) => {
        // Las barras no son el lienzo. Este handler cuelga del Root del
        // ScrollArea, asi que tambien le llegan los clics que caen en ellas, y
        // sin esto agarrar una barra contaria como clic en el fondo y soltaria
        // la seleccion en cuanto empezaras a arrastrarla.
        //
        // Se pregunta por el viewport y no por la barra porque el viewport es
        // el unico nodo que Radix marca con un atributo propio. Y de paso sale
        // mejor la regla: el lienzo es lo que cuelga del viewport, y lo que no
        // (las barras, la esquina entre ambas) no lo es.
        if (
            !(e.target as HTMLElement | null)?.closest(
                "[data-radix-scroll-area-viewport]"
            )
        ) {
            return
        }

        // Boton central, barra espaciadora, o la mano activa con el izquierdo.
        const wantsPan =
            e.button === 1 || (e.button === 0 && (spaceHeld.current || handMode))
        if (!wantsPan) {
            // Clic con el puntero en el fondo del viewport, fuera de la pagina:
            // soltar la seleccion para que el panel vuelva a "Selecciona un
            // componente...". craft solo escucha sobre sus nodos, asi que este
            // hueco no lo cubre nadie mas.
            //
            // Lo fiable es preguntar si el clic cayo dentro de la pagina: el
            // medidor ocupa todo el lienzo, asi que el fondo de alrededor es el,
            // no el viewport.
            const page = pageRef.current
            if (e.button === 0 && page && !page.contains(e.target as Node)) {
                actions.selectNode()
            }
            return
        }
        // En el boton central evita el autoscroll del navegador, que dentro de un
        // contenedor con scroll de verdad sale con mas ganas.
        e.preventDefault()
        e.stopPropagation()
        // Unico momento del arrastre en que se mide: a partir de aqui el gesto
        // trabaja con estas medidas y no toca el layout.
        remeasure()
        dragging.current = { x: e.clientX, y: e.clientY }
        setIsPanning(true)
    }

    return (
        <ScrollArea
            // Quien scrollea es el viewport de dentro, no este Root: ahi va la
            // camara, que coloca la vista escribiendo su scroll.
            viewportRef={viewportRef}
            // El canvas se recorre en los dos ejes: la pagina se sale por abajo
            // casi siempre, y por los lados en cuanto se acerca el zoom.
            horizontal
            // Las barras salen cuando hay algo que recorrer, como las de antes.
            type="auto"
            thumbClassName="bg-primary"
            onMouseDown={onMouseDown}
            className={`relative flex-1 bg-muted ${
                isPanning ? "cursor-grabbing" : handMode ? "cursor-grab" : ""
            }`}
            // Radix mete un div suyo entre el viewport y lo que le das, con
            // display:table y min-width:100%.
            //
            // OJO: a ese div no se le puede fijar el tamaño. Radix decide si
            // saca cada barra mirando si hay desbordamiento, y lo recalcula con
            // un ResizeObserver sobre el viewport y sobre ese div. El display
            // table esta justo para que crezca con lo que lleva dentro; si se
            // le pone un alto o un ancho fijos deja de cambiar de tamaño, su
            // observador no salta nunca y las barras se quedan con el resultado
            // del primer calculo: el de antes de que la camara escriba el
            // tamaño del medidor, o sea sin nada que recorrer. Las barras no
            // salian al entrar y solo aparecian al mover un panel, que es lo
            // unico que le cambiaba el tamaño al viewport.
            //
            // El min-h-full si vale, porque es un minimo y le deja crecer: solo
            // cubre el primer frame, cuando el medidor todavia no tiene tamaño
            // y su unico hijo va absoluto.
            viewportClassName="[&>div]:!min-h-full"
        >
            {/* El medidor. No se ve: existe para que el navegador sepa cuanto hay
                que recorrer, porque el scale del contenido no ocupa sitio en el
                layout. Su tamaño lo escribe la camara (ver canvas-camera.tsx).

                overflow-hidden porque el div del contenido es tan ancho como el
                viewport y, con la pagina mas estrecha, le sobra a los lados; ese
                sobrante esta vacio y sin recortarlo añadiria recorrido de scroll
                sin nada dentro.

                El minimo de ancho y alto cubre el primer frame, antes de que la
                camara le escriba su tamaño: sin el, como su unico hijo va
                absoluto, el medidor mediria cero y el canvas parpadearia vacio.
                Despues no estorba, porque nunca se le calcula un tamaño menor
                que el viewport. */}
            <div ref={sizerRef} className="relative min-h-full min-w-full overflow-hidden">
                {/* El transform y la posicion NO se pintan desde el estado: los
                    escribe la camara directamente sobre este nodo. Asi mover la
                    vista no pasa por un render de React, y React tampoco puede
                    pisar con un valor de hace un frame lo que el gesto acaba de
                    escribir. */}
                <div
                    ref={contentRef}
                    style={{
                        position: "absolute",
                        transformOrigin: "0 0",
                        // El contenido no captura el puntero mientras se arrastra
                        // la camara (si no, craft leeria el gesto como seleccion),
                        // ni con la mano activa, que es lo que la vuelve "solo
                        // mover", ni mientras se espera el contenido de la pagina.
                        pointerEvents: contenidoInerte ? "none" : undefined,
                    }}
                >
                    {children}
                </div>

                {/* Capa que traga los clics mientras el contenido esta inerte.

                    El pointerEvents:none de arriba no basta: SelectableNode se
                    repone el puntero con "!pointer-events-auto" para poder
                    seleccionar componentes anidados, y ese !important gana sobre
                    lo heredado. Desde el ancestro no hay forma de ganarle, porque
                    el nodo declara la propiedad sobre si mismo.

                    Va dentro del medidor y no del viewport para que cubra todo lo
                    que se puede recorrer, no solo la primera pantalla. Y como
                    sigue siendo descendiente del viewport, el mousedown llega al
                    handler del pan y la rueda a su listener. */}
                {contenidoInerte && <div className="absolute inset-0" />}
            </div>
        </ScrollArea>
    )
}
