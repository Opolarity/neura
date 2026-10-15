import { useEffect, useState } from "react"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { cachedIcon, loadIcon } from "@/modules/ecommerce/editor/lib/icon-loader"

/**
 * La definicion del icono guardado en `key` ("fas:star", o un nombre antiguo
 * como "Instagram"). Mientras llega devuelve `undefined`; si no existe, `null`.
 */
export function useIconDefinition(key: string): IconDefinition | null | undefined {
  const [def, setDef] = useState(() => cachedIcon(key))

  useEffect(() => {
    const ya = cachedIcon(key)
    setDef(ya)
    if (ya !== undefined) return

    let vigente = true
    loadIcon(key).then((recibida) => {
      if (vigente) setDef(recibida)
    })
    return () => {
      vigente = false
    }
  }, [key])

  return def
}
