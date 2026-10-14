// Campo del panel que solo edita el modo de pantalla que se esta viendo.
//
// Una propiedad responsiva tiene un valor por modo (escritorio, tableta,
// celular). En vez de sacar los tres campos a la vez, se muestra el del modo
// activo del editor y el icono dice de cual se trata. Asi el panel no crece por
// tres y lo que se edita es siempre lo que se esta viendo en el canvas.

import type { ReactNode } from "react"
import { Monitor, Smartphone, Tablet } from "lucide-react"
import { cn } from "@/shared/utils/utils"
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field"
import { useViewport, type Viewport } from "@/modules/ecommerce/editor/components/viewport-context"

const VIEWPORT_ICONS = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
} as const

/**
 * Icono del modo de pantalla. El de tableta va girado un cuarto de vuelta: de
 * pie es casi el mismo rectangulo que el del celular y a 14px no se distinguen.
 */
export function ViewportIcon({
    viewport,
    className,
}: {
    viewport: Viewport
    className?: string
}) {
    const Icon = VIEWPORT_ICONS[viewport]
    return <Icon className={cn(className, viewport === "tablet" && "rotate-90")} />
}

/**
 * `children` recibe el modo activo para que cada propiedad decida que valor lee
 * y escribe, y el id con el que emparejar su control con la etiqueta. Se pasa
 * como funcion en vez de como nodo suelto porque el control cambia de una
 * propiedad a otra: aqui hay un Input, en otra habra un Select.
 *
 * Fuera del editor no renderiza nada: no hay un modo activo que editar.
 */
export function ResponsiveField({
    label,
    children,
}: {
    label: string
    children: (viewport: Viewport, id: string) => ReactNode
}) {
    const viewport = useViewport()
    if (!viewport) return null

    return (
        <PanelField
            label={
                <>
                    {label}
                    <ViewportIcon viewport={viewport} className="h-3.5 w-3.5" />
                </>
            }
        >
            {(id) => children(viewport, id)}
        </PanelField>
    )
}
