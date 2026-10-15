// Label de un campo del panel de propiedades con, si hay ayuda, el icono de
// informacion al lado que la muestra en un tooltip. Es el mismo patron que
// "Nombre" en la lista de Beneficios.

import type { ReactNode } from "react"
import { Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function FieldLabel({
  htmlFor,
  children,
  help,
  helpLabel,
  onClick,
}: {
  htmlFor?: string
  /** Para campos que htmlFor no puede enfocar (p. ej. un editor de codigo). */
  onClick?: () => void
  children: ReactNode
  help?: ReactNode
  /** Texto accesible del icono; por defecto "Ayuda". */
  helpLabel?: string
}) {
  const label = (
    <Label htmlFor={htmlFor} onClick={onClick} className="text-[11px] text-foreground/80">
      {children}
    </Label>
  )
  if (!help) return label
  return (
    <div className="flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={helpLabel ?? "Ayuda"}
            className="text-muted-foreground hover:text-foreground cursor-help"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-[12px]">
          {help}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
