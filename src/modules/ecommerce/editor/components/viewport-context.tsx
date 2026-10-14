import { createContext, useContext } from "react"

/** Modos de previsualizacion del editor. */
export type Viewport = "desktop" | "tablet" | "mobile"

/**
 * Ancho de la pagina en cada modo. Son anchos de navegador reales, no el ancho
 * del panel: si la pagina se estirase al panel, el diseño cambiaria segun el
 * tamaño de la ventana de quien edita.
 *
 * Los valores estan elegidos para caer en los breakpoints de Tailwind que usa el
 * proyecto (sm 640, md 768, lg 1024, xl 1280): 1440 entra en lg, 768 es
 * exactamente md, y 390 queda por debajo de md.
 */
export const VIEWPORT_WIDTHS: Record<Viewport, number> = {
    desktop: 1440,
    tablet: 768,
    mobile: 390,
}

/**
 * null significa "no estamos en el editor": es lo que ve la tienda, donde el
 * layout lo resuelven las media queries contra el ancho real del navegador.
 *
 * Dentro del editor hay un modo concreto, y ahi el layout NO puede depender de
 * media queries: estas miden la ventana de quien edita, no la pagina, asi que
 * con el panel estrecho el contenido se dibujaria en movil aunque el modo sea
 * escritorio. Por eso en el editor el valor se fuerza.
 */
export const ViewportContext = createContext<Viewport | null>(null)

export function useViewport() {
  return useContext(ViewportContext)
}

/**
 * Valor que corresponde al modo activo, o null en la tienda.
 *
 * Uso tipico en un componente:
 *
 *   const cols = useResponsiveValue({ desktop: colsDesktop, tablet: colsTablet, mobile: colsMobile })
 *   // cols !== null -> editor: fijar ese valor
 *   // cols === null -> tienda: dejar las media queries
 */
export function useResponsiveValue<T>(values: Record<Viewport, T>): T | null {
  const viewport = useViewport()
  return viewport ? values[viewport] : null
}
