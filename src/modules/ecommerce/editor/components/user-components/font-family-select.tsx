// El desplegable de fuentes, y nada mas. La etiqueta la pone quien lo usa: este
// componente no sabe como se llama la propiedad en cada panel ("Fuente",
// "Fuente de Texto"...) ni si necesita adornarla.

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fontFamilyOptions, type FontFamily } from "@/modules/ecommerce/editor/lib/font-families"

interface FontFamilySelectProps {
  value: FontFamily
  onChange: (value: FontFamily) => void
  /** Del <label> de la propiedad, para que pulsarlo abra el desplegable. */
  id?: string
}

export function FontFamilySelect({ value, onChange, id }: FontFamilySelectProps) {
  return (
    <Select value={value ?? "sans"} onValueChange={(val) => onChange(val as FontFamily)}>
      <SelectTrigger id={id} className="h-8 text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {fontFamilyOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
