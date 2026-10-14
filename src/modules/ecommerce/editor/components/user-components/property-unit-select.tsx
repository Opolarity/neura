// El desplegable de unidad, y con el la lista de unidades que existen en el
// editor.
//
// Vive aparte del campo numerico porque no todas las propiedades lo quieren
// pegado a el: el relleno son cuatro numeros con una sola unidad, y ahi el
// desplegable va arriba, junto a la etiqueta. Suelto puede reusarlo cualquier
// control nuevo sin arrastrar un input que no necesita.

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PencilLine } from "lucide-react"

// Las unidades viven aqui, en un solo sitio: son la definicion del propio
// control, no algo que cada panel deba repetir.
const UNIT_OPTIONS = [
  { value: "px", label: "px" },
  { value: "em", label: "em" },
  { value: "rem", label: "rem" },
  { value: "%", label: "%" },
  { value: "auto", label: "auto" },
  { value: "custom", label: "personalizado" },
] as const

// Derivado de la lista para que no puedan desincronizarse: anadir una unidad
// arriba la hace valida en todo el editor sin tocar nada mas.
export type PropertyUnit = (typeof UNIT_OPTIONS)[number]["value"]

export function PropertyUnitSelect({
  value,
  onChange,
  exclude = [],
}: {
  value: PropertyUnit
  onChange: (val: PropertyUnit) => void
  /**
   * Unidades que no aplican a esta propiedad. Un espaciado no admite "auto", un
   * radio de borde no se mide en em: cada panel recorta lo que sobra en vez de
   * ofrecer opciones que generan CSS que el navegador ignora.
   */
  exclude?: PropertyUnit[]
}) {
  const options = UNIT_OPTIONS.filter((option) => !exclude.includes(option.value))

  return (
    <Select value={value} onValueChange={(val) => onChange(val as PropertyUnit)}>
      <SelectTrigger className="w-20 h-8 text-[12px] shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-[12px]">
            {/* La unidad libre se reconoce mejor por el lapiz que por su
                nombre, que ademas no cabe en el ancho del desplegable. */}
            {option.value === "custom" ? (
              <PencilLine className="h-4 w-4" />
            ) : (
              option.label
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
