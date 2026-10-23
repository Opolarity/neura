// Las definiciones de los iconos que pinta el lienzo.
//
// El editor no lleva el catalogo de FontAwesome en su chunk (~515 KB gz, ver
// lib/icon-catalog.ts): se pide aparte la primera vez que un Icono lo
// necesita, asi que una pagina sin iconos no lo descarga y el lienzo se pinta
// sin esperarlo. Lo ya resuelto queda en memoria para el resto de la sesion.

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"

/** El icono que se pinta cuando el guardado no existe o viene vacio. */
export const DEFAULT_ICON_KEY = "fas:star"

type IconCatalog = typeof import("@/modules/ecommerce/editor/lib/icon-catalog")

const definiciones = new Map<string, IconDefinition | null>()
let catalogo: Promise<IconCatalog> | null = null

function cargarCatalogo(): Promise<IconCatalog> {
  if (!catalogo) {
    catalogo = import("@/modules/ecommerce/editor/lib/icon-catalog").catch((error) => {
      // Un fallo de red no se guarda: el siguiente montaje lo vuelve a pedir.
      catalogo = null
      throw error
    })
  }
  return catalogo
}

/** Lo ya resuelto, o `undefined` si todavia no se pidio o no llego. */
export function cachedIcon(key: string): IconDefinition | null | undefined {
  return definiciones.get(key)
}

/**
 * Apunta una definicion que ya se tiene, para no pedirla. Lo usa el panel del
 * Icono, que carga el catalogo entero, al elegir un icono.
 */
export function primeIcon(key: string, def: IconDefinition) {
  definiciones.set(key, def)
}

/**
 * La definicion del icono guardado en `key`, resuelta como siempre: los nombres
 * antiguos y los desconocidos dan el mismo icono que antes (normalizeIconKey).
 */
export async function loadIcon(key: string): Promise<IconDefinition | null> {
  const ya = definiciones.get(key)
  if (ya !== undefined) return ya

  try {
    const { ICON_BY_KEY, normalizeIconKey } = await cargarCatalogo()
    const def = ICON_BY_KEY.get(normalizeIconKey(key))?.icon ?? null
    definiciones.set(key, def)
    return def
  } catch (error) {
    console.error("No se pudo cargar el catalogo de iconos:", error)
    return null
  }
}
