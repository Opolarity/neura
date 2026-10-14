// Selector de angulo: un dial circular con un handle que solo puede recorrer
// la circunferencia. El valor sigue la convencion de CSS (la misma que usa
// `linear-gradient`): 0° apunta arriba, 90° a la derecha, 180° abajo, 270° a
// la izquierda, girando en el sentido del reloj.
//
// El handle NO sigue al puntero: se toma el angulo entre el centro del dial y
// donde esta el puntero, y con ese angulo se recoloca el handle sobre el
// radio de recorrido. Asi da igual hacer clic sobre el handle, dentro del
// dial o incluso fuera mientras se arrastra: siempre queda en la orbita.

import { useCallback, useRef, useState } from "react"

/** Diametro del dial, en px. El handle orbita un poco por dentro del borde. */
const DIAL_SIZE = 72
const HANDLE_SIZE = 12
const RADIUS = DIAL_SIZE / 2 - HANDLE_SIZE / 2 - 2

function normalizar(grados: number) {
  return ((Math.round(grados) % 360) + 360) % 360
}

/**
 * De la posicion del puntero al angulo CSS. `atan2` mide desde el eje X
 * positivo (la derecha) y, con el eje Y hacia abajo, crece en sentido horario;
 * sumarle 90 lleva el cero arriba, que es donde lo pone CSS.
 */
function anguloDesde(centerX: number, centerY: number, x: number, y: number) {
  const dx = x - centerX
  const dy = y - centerY
  const grados = (Math.atan2(dy, dx) * 180) / Math.PI
  return normalizar(grados + 90)
}

/** Del angulo CSS a donde va el handle dentro del dial (esquina superior izquierda). */
function posicionHandle(angulo: number) {
  const rad = ((angulo - 90) * Math.PI) / 180
  const cx = DIAL_SIZE / 2 + RADIUS * Math.cos(rad)
  const cy = DIAL_SIZE / 2 + RADIUS * Math.sin(rad)
  return { left: cx - HANDLE_SIZE / 2, top: cy - HANDLE_SIZE / 2 }
}

interface AnglePickerProps {
  value: number
  onChange: (angle: number) => void
}

export function AnglePicker({ value, onChange }: AnglePickerProps) {
  const dialRef = useRef<HTMLDivElement>(null)
  const angulo = normalizar(Number.isFinite(value) ? value : 0)
  const handle = posicionHandle(angulo)

  // Lo tecleado en el campo de grados mientras tiene el foco; null cuando no
  // se esta editando y el campo ensena el valor real con su simbolo.
  const [texto, setTexto] = useState<string | null>(null)

  const emitirDesdePuntero = useCallback(
    (clientX: number, clientY: number) => {
      const dial = dialRef.current
      if (!dial) return
      const r = dial.getBoundingClientRect()
      onChange(anguloDesde(r.left + r.width / 2, r.top + r.height / 2, clientX, clientY))
    },
    [onChange],
  )

  // Un solo juego de Pointer Events cubre raton, dedo y lapiz. Capturar el
  // puntero en el dial hace que los `pointermove` sigan llegando aunque el
  // arrastre salga del circulo, y `touch-action: none` (abajo, en el estilo)
  // evita que el navegador se lleve el gesto como scroll.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    emitirDesdePuntero(e.clientX, e.clientY)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    emitirDesdePuntero(e.clientX, e.clientY)
  }
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // Con el dial enfocado, las flechas mueven de grado en grado (de 15 con Shift).
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const paso = e.shiftKey ? 15 : 1
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault()
      onChange(normalizar(angulo + paso))
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault()
      onChange(normalizar(angulo - paso))
    }
  }

  // El campo de grados se aplica al salir o con Enter, como la posicion de las
  // paradas: solo un entero, con o sin el simbolo; lo demas se descarta.
  const aplicarTexto = (raw: string) => {
    setTexto(null)
    const limpio = raw.trim().replace(/°$/, "").trim()
    if (!/^\d+$/.test(limpio)) return
    onChange(normalizar(Number(limpio)))
  }

  return (
    <div className="flex items-center gap-3">
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label="Dirección del degradado"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={angulo}
        aria-valuetext={`${angulo} grados`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative shrink-0 cursor-pointer select-none rounded-full border border-input bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        style={{ width: DIAL_SIZE, height: DIAL_SIZE, touchAction: "none" }}
      >
        {/* Centro: solo referencia visual, sin interaccion propia. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/50"
        />
        {/* Radio que une el centro con el handle: hace legible la direccion. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 origin-left bg-muted-foreground/40"
          style={{
            width: RADIUS,
            height: 1,
            transform: `rotate(${angulo - 90}deg)`,
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full border-2 border-background bg-primary shadow-sm"
          style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, left: handle.left, top: handle.top }}
        />
      </div>

      <div className="flex h-8 w-16 items-center rounded-md border border-input">
        <input
          aria-label="Ángulo en grados"
          inputMode="numeric"
          value={texto ?? `${angulo}°`}
          onFocus={() => setTexto(String(angulo))}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={(e) => aplicarTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              e.currentTarget.blur()
            }
            if (e.key === "Escape") {
              e.preventDefault()
              setTexto(null)
            }
          }}
          className="h-full w-full min-w-0 bg-transparent px-2 text-center text-[12px] tabular-nums outline-none"
        />
      </div>
    </div>
  )
}
