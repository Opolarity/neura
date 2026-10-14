import { useEffect, useRef } from "react"
import { useEditor } from "@craftjs/core"

// "offline" es el fallo de red: el fetch no llego a salir (status 0). Se
// separa de "error" porque el trabajo si queda respaldado en local.
export type SaveOutcome = "ok" | "unauthorized" | "error" | "offline"

// Mínimo que necesitamos del query de craftjs (evita depender de sus tipos internos)
export interface CraftQueryLike {
  serialize(): string
}

export interface SessionControllerHandle {
  onNodesChange(query: CraftQueryLike): void
  markSaved(json: string): void
  /**
   * Vuelve a tomar el contenido actual como punto de partida, sin haber
   * guardado nada.
   *
   * Hace falta al cargar la pagina en diferido. El editor se monta con un
   * canvas vacio, asi que el baseline del efecto de abajo es ese vacio; cuando
   * despues llega el contenido de verdad, craft avisa del cambio (su
   * suscripcion mira el JSON serializado, no el tipo de accion, asi que el
   * history.ignore() de <Frame> no la silencia) y el editor abriria diciendo
   * "cambios sin guardar" sin que nadie haya tocado nada.
   */
  rebaseline(): void
  /**
   * Da el contenido actual por pendiente de guardar, sin que nadie lo haya
   * tocado.
   *
   * Es el gemelo de `rebaseline` para el contenido que entra ya sucio: el
   * respaldo local. Ese JSON es trabajo que nunca llego al servidor, asi que
   * cargarlo y darlo por guardado —que es lo que haria el rebaseline de
   * ContentLoader— dejaria el editor diciendo que no hay nada que guardar
   * justo despues de rescatarlo.
   */
  markDirty(): void
  isDirty(): boolean
  getJson(): string
}

interface SessionControllerProps {
  handleRef: React.MutableRefObject<SessionControllerHandle | null>
  /** Avisa cuando cambia el booleano, no en cada tecla. */
  onDirtyChange?: (dirty: boolean) => void
}

// Detección de cambios reales (dirty) y serialización del canvas de craftjs.
//
// En el ecommerce además llevaba la sesión del editor (aviso por inactividad y
// cierre). En el ERP no hay sesión propia del editor —vale la del ERP—, así que
// solo queda el seguimiento de cambios sin guardar.
export function SessionController({
  handleRef,
  onDirtyChange,
}: SessionControllerProps) {
  const { query } = useEditor()

  const dirtyRef = useRef(false)
  const lastSavedJsonRef = useRef<string | null>(null)

  const queryRef = useRef(query)
  queryRef.current = query
  const onDirtyChangeRef = useRef(onDirtyChange)
  onDirtyChangeRef.current = onDirtyChange

  useEffect(() => {
    // Baseline: el <Frame> ya deserializó durante el render, así que este
    // serialize refleja el contenido cargado y neutraliza el primer disparo
    // espurio de onNodesChange.
    lastSavedJsonRef.current = queryRef.current.serialize()

    // Solo avisa cuando el booleano cambia de verdad. onNodesChange se
    // dispara en cada tecla, y subir eso a estado repintaria la barra sin
    // parar; el ref sigue siendo la fuente para quien lo lee bajo demanda.
    const marcarDirty = (siguiente: boolean) => {
      if (dirtyRef.current === siguiente) return
      dirtyRef.current = siguiente
      onDirtyChangeRef.current?.(siguiente)
    }

    handleRef.current = {
      onNodesChange(craftQuery: CraftQueryLike) {
        const json = craftQuery.serialize()
        marcarDirty(json !== lastSavedJsonRef.current)
      },
      markSaved(json: string) {
        lastSavedJsonRef.current = json
        marcarDirty(false)
      },
      rebaseline() {
        lastSavedJsonRef.current = queryRef.current.serialize()
        marcarDirty(false)
      },
      markDirty() {
        // Sin punto de partida: cualquier cosa que haya en el canvas cuenta
        // como pendiente, y lo sigue contando aunque despues se deshaga el
        // ultimo cambio. Se limpia con el markSaved del guardado.
        lastSavedJsonRef.current = null
        marcarDirty(true)
      },
      isDirty() {
        return dirtyRef.current
      },
      getJson() {
        return queryRef.current.serialize()
      },
    }

    return () => {
      handleRef.current = null
    }
  }, [handleRef])

  return null
}
