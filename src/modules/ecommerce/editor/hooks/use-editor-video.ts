// Un video no debe reproducirse mientras se edita.
//
// El autoPlay no es un evento de puntero, asi que no lo detienen ni el wrapper
// de seleccion ni el CSS que apaga los eventos del contenido: hay que apagarlo
// en el propio <video>. Este hook centraliza las dos mitades del problema para
// los tres componentes que llevan video (Video, Contenedor y Seccion).

import { useEffect, useRef } from "react"
import { useEditor } from "@craftjs/core"

/**
 * @param autoplay Si el video debe reproducirse solo fuera del editor. Los
 * videos de fondo (Contenedor y Seccion) siempre; el componente Video lo deja
 * en manos del usuario.
 */
export function useEditorVideo(autoplay: boolean = true) {
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }))

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (enabled) {
            // Bajar autoPlay no detiene una reproduccion ya empezada: al volver
            // de Preview a Edicion hay que pausarla a mano.
            video.pause()
            // Y se rebobina: dejarlo congelado en un fotograma cualquiera se
            // confunde con el contenido real del componente.
            video.currentTime = 0
            return
        }

        // Y al reves: subir autoPlay no arranca nada, porque ese atributo solo
        // actua al cargar el elemento. Viniendo de Edicion el video esta parado,
        // asi que en Preview hay que darle al play.
        if (!autoplay) return
        // Puede rechazar si el navegador bloquea la reproduccion (video con
        // sonido sin interaccion previa): ahi se queda parado, como haria el
        // autoPlay por su cuenta.
        void video.play().catch(() => {})
    }, [enabled, autoplay])

    // Preview y tienda publica son el mismo enabled=false, asi que fuera del
    // editor el video se comporta igual que en la pagina publicada.
    return { videoRef, canAutoPlay: !enabled }
}
