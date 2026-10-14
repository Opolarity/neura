// Bloque colapsable del panel de settings: la cabecera entera abre y cierra, y
// el chevron va al extremo derecho girando al contraerse. Arranca contraido
// para que el panel no llegue lleno de campos abiertos.

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function SettingsSection({
    title,
    children,
    defaultOpen = false,
    badge,
    className,
}: {
    title: string
    children: ReactNode
    defaultOpen?: boolean
    // Se dibuja a la izquierda del chevron y sigue visible con la seccion
    // cerrada: sirve para avisos que no deben esconderse al colapsar.
    badge?: ReactNode
    className?: string
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            // El borde va en la seccion, no en el contenedor del panel, para que
            // la linea cruce todo el ancho: el padding lateral vive aqui dentro.
            className={`border-t border-border ${className ?? ""}`}
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between gap-2 w-full px-4 py-3 cursor-pointer select-none">
                    <p className="text-sm font-medium">
                        {title}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {badge}
                        <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
                        />
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
        </Collapsible>
    )
}
