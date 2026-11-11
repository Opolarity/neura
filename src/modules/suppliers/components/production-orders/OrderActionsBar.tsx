import { ChevronDown, ClipboardList, FileText, Loader2, PackageCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderActionsBarProps {
  onReceive: () => void;
  /** Por qué no se puede recibir todavía, o null si se puede. */
  receiveBlockedReason: string | null;
  /** Apagado aunque no haya motivo que decir (nada que recibir). */
  receiveDisabled?: boolean;
  onPrintOrder: () => void;
  onPrintRequirement: () => void;
  /** Sin receta no hay requerimiento de materiales: la opción no aparece. */
  showRequirement?: boolean;
  printing: boolean;
}

/**
 * Lo que se hace con una orden, siempre a la vista y en su cabecera.
 *
 * Antes recibir era un botón dentro de la última columna de cada talla, y
 * los papeles estaban repartidos. Aquí van las cosas que se buscan: recibir
 * lo terminado e imprimir. La ruta y sus encargos están en la pizarra.
 *
 * Si algo no se puede, el motivo se LEE debajo del botón: en una tablet no hay
 * ratón para ver un tooltip.
 */
export const OrderActionsBar = ({
  onReceive,
  receiveBlockedReason,
  receiveDisabled = receiveBlockedReason !== null,
  onPrintOrder,
  onPrintRequirement,
  showRequirement = true,
  printing,
}: OrderActionsBarProps) => (
  <div className="flex flex-col items-end gap-1">
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        className="h-10 gap-2"
        onClick={onReceive}
        disabled={receiveDisabled}
      >
        <PackageCheck className="h-4 w-4" />
        Recibir prendas
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 gap-2" disabled={printing}>
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Imprimir
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem className="gap-2 py-2" onSelect={onPrintOrder}>
            <FileText className="h-4 w-4" />
            Orden de producción
          </DropdownMenuItem>
          {showRequirement && (
            <DropdownMenuItem className="gap-2 py-2" onSelect={onPrintRequirement}>
              <ClipboardList className="h-4 w-4" />
              Requerimiento de materiales
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {receiveBlockedReason && (
      <p className="text-muted-foreground text-xs">{receiveBlockedReason}</p>
    )}
  </div>
);
