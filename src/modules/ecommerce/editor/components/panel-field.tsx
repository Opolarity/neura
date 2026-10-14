// Una propiedad del panel: su etiqueta y su control, ya emparejados.
//
// El emparejado es el motivo de que exista. Un <Label> suelto encima de un
// <Input> no los relaciona: hace falta que el label apunte al id del control
// para que pulsar el texto lleve el foco al campo, como en cualquier formulario.
// Escrito a mano habria que inventar un id unico por campo, y en el editor hay
// mas de trescientos.
//
// El id lo da useId, que es la forma correcta en React: genera uno estable y
// distinto por instancia, y no se descuadra entre el render del servidor y el
// del navegador como pasaria con un contador propio.

import { useId, type ReactNode } from "react"
import { Label } from "@/components/ui/label"

export function PanelField({
    label,
    children,
}: {
    label: ReactNode
    // Recibe el id para colgarlo del control. Va como funcion porque el control
    // cambia en cada propiedad: aqui un Input, alla un Select.
    children: (id: string) => ReactNode
}) {
    const id = useId()

    return (
        <div className="flex flex-col gap-1.5">
            <Label
                htmlFor={id}
                className="text-[11px] text-foreground/80 flex items-center gap-1"
            >
                {label}
            </Label>
            {children(id)}
        </div>
    )
}
