// Un valor con su unidad, en una fila: el campo del numero y el desplegable de
// unidad. Nada mas.
//
// La etiqueta la pone quien lo usa. Traerla dentro obligaba a este componente a
// saber como se llama cada propiedad, y sobre todo cerraba la puerta a
// adornarla —un icono de dispositivo, un tooltip, un aviso—, porque habria que
// ir pasandoselos de rebote uno a uno.

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  PropertyUnitSelect,
  type PropertyUnit,
} from "@/modules/ecommerce/editor/components/user-components/property-unit-select"

/**
 * El texto de apoyo depende de la unidad elegida, no de la propiedad: un campo
 * en px espera lo mismo aqui que en cualquier otro panel. Vive junto a las
 * unidades para que no lo repita cada componente ni acabe diciendo cosas
 * distintas en cada uno.
 *
 * Para las unidades de medida sugiere el formato —un numero— y no una palabra:
 * poner ahi "auto" haria creer que el campo vacio se resuelve solo, y en la
 * mayoria de propiedades eso no es cierto.
 */
const PLACEHOLDER_BY_UNIT: Record<PropertyUnit, string> = {
  px: "0",
  em: "0",
  rem: "0",
  "%": "0",
  auto: "auto",
  custom: "ej: 100vh, 100%",
}

/**
 * Valor listo para CSS. Vive aqui, junto a las unidades, porque quien define
 * que unidades hay es quien sabe traducirlas; estaba copiada en tres sitios y
 * cada copia habia que acordarse de actualizarla.
 */
export function resolveUnitValue(
  value: number | undefined,
  unit: PropertyUnit,
  custom: string,
): string {
  if (unit === "auto") return "auto"
  if (unit === "custom") return custom || "0"
  return `${value ?? 0}${unit}`
}

interface PropertyUnitInputProps {
  value: number | undefined
  unit: PropertyUnit
  custom: string
  onValueChange: (val: number | undefined) => void
  onUnitChange: (val: PropertyUnit) => void
  onCustomChange: (val: string) => void
  /**
   * Texto de apoyo del campo numerico, para lo que la unidad no puede saber:
   * el valor que se va a heredar de otro modo de pantalla, por ejemplo. Sin el,
   * cada unidad pone el suyo.
   */
  placeholder?: string
  /** Unidades que no aplican a esta propiedad; van tal cual al desplegable. */
  exclude?: PropertyUnit[]
  /** Del <label> de la propiedad, para que pulsarlo enfoque el campo. */
  id?: string
}

export function PropertyUnitInput({
  value,
  unit,
  custom,
  onValueChange,
  onUnitChange,
  onCustomChange,
  placeholder,
  exclude = [],
  id,
}: PropertyUnitInputProps) {
  // Lo que se esta tecleando. Existe para poder dejar el campo a medias: al
  // escribir "1.5" se pasa por "1.", que como numero vale 1, y sin este borrador
  // el punto desapareceria en cuanto se pulsa. Al salir del campo se descarta y
  // el input vuelve a leer la prop.
  const [draft, setDraft] = useState<string | null>(null)

  // Las clases van en el componente y no heredadas del panel: asi se planta con
  // el tamano correcto lo envuelva quien lo envuelva.
  const inputClass = "flex-1 h-8 text-[12px] md:text-[12px]"

  return (
    <div className="flex gap-2">
      {unit === "auto" ? (
        // El valor de la prop se conserva: si se vuelve a px, el numero de antes
        // sigue ahi y no hay que reescribirlo.
        <Input
          id={id}
          className={inputClass}
          type="text"
          value=""
          placeholder={PLACEHOLDER_BY_UNIT.auto}
          disabled
        />
      ) : unit === "custom" ? (
        <Input
          id={id}
          className={inputClass}
          type="text"
          value={custom}
          placeholder={PLACEHOLDER_BY_UNIT.custom}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          className={inputClass}
          type="number"
          min={0}
          // Admite decimales: un alto de linea de 1.5 es lo habitual, y con
          // parseInt se quedaba en 1.
          step="any"
          value={draft ?? (value === undefined ? "" : String(value))}
          placeholder={placeholder ?? PLACEHOLDER_BY_UNIT[unit]}
          onChange={(e) => {
            const text = e.target.value
            setDraft(text)
            if (text === "") {
              onValueChange(undefined)
              return
            }
            // Se avisa en cuanto el texto es un numero, para que el canvas
            // responda mientras se escribe; lo que no lo sea se ignora hasta
            // que lo sea.
            const parsed = Number(text)
            if (!Number.isNaN(parsed)) onValueChange(parsed)
          }}
          onBlur={() => setDraft(null)}
        />
      )}
      <PropertyUnitSelect value={unit} onChange={onUnitChange} exclude={exclude} />
    </div>
  )
}
