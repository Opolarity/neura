// Un carrusel no debe quedarse a medias al volver de Preview a Edicion: si se
// quedo en la diapositiva 4, eso se confunde con el contenido real del
// componente. Al entrar en edicion vuelve a la primera.
//
// El apagado del autoplay no hace falta tocarlo aqui: el array de plugins ya
// depende de `enabled` y embla reinicia solo. Esto cubre unicamente la posicion.

import { useEffect } from "react"
import { useEditor } from "@craftjs/core"

// Firma minima de la api de embla, para no atarse a su tipo (unos componentes
// la tipan como CarouselApi y otros como any).
type CarouselApiLike =
    | { scrollTo: (index: number, jump?: boolean) => void }
    | null
    | undefined

export function useEditorCarouselReset(api: CarouselApiLike) {
    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }))

    useEffect(() => {
        if (!enabled || !api) return
        // El segundo argumento salta sin animar: en el editor no aporta nada
        // ver el carrusel rebobinarse solo.
        api.scrollTo(0, true)
    }, [enabled, api])
}
