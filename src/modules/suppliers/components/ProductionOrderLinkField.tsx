import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/shared/utils/utils";
import { ProductionOrder } from "../types/productionOrders.types";
import {
  ProductionOrderLinkValue,
  emptyProductionOrderLink,
  selectProductionOrder,
} from "../types/productionOrderLink.types";

interface ProductionOrderLinkFieldProps {
  value: ProductionOrderLinkValue;
  onChange: (value: ProductionOrderLinkValue) => void;
  productionOrders: ProductionOrder[];
  productionOrderSearch: string;
  onProductionOrderSearchChange: (value: string) => void;
  disabled?: boolean;
  /** `cell` compacta el bloque para meterlo dentro de una celda de tabla. */
  layout?: "stacked" | "cell";
}

/**
 * Checkbox "Vincular a orden de producción" + combobox de órdenes
 * existentes. Sin alta inline: las órdenes tienen su propia pantalla
 * ("Nueva Orden de producción").
 *
 * El vínculo se guarda como una fila de production_order_info sin proceso
 * ni grupo todavía — se asignan después desde el diálogo "Procesos" de esa
 * orden, que no cambia.
 */
export const ProductionOrderLinkField = ({
  value,
  onChange,
  productionOrders,
  productionOrderSearch,
  onProductionOrderSearchChange,
  disabled = false,
  layout = "stacked",
}: ProductionOrderLinkFieldProps) => {
  const isCell = layout === "cell";
  const [popoverOpen, setPopoverOpen] = useState(false);

  const toggleLink = (linked: boolean) => {
    onChange(linked ? { ...value, linked: true } : emptyProductionOrderLink());
  };

  return (
    <div className={cn("space-y-2", isCell && "space-y-1")}>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={value.linked}
          onCheckedChange={(checked) => toggleLink(checked === true)}
          disabled={disabled}
          id="production-order-link-checkbox"
        />
        <Label
          htmlFor="production-order-link-checkbox"
          className="font-normal cursor-pointer"
        >
          Vincular a orden de producción
        </Label>
      </div>

      {value.linked && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              disabled={disabled}
              className="w-full justify-between font-normal"
            >
              <span className="truncate">
                {value.productionOrderName || "Seleccionar orden..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <div className="flex gap-2 p-2 border-b">
                <Input
                  value={productionOrderSearch}
                  onChange={(e) => onProductionOrderSearchChange(e.target.value)}
                  placeholder="Buscar orden de producción..."
                  className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <Button type="button" variant="outline" className="shrink-0">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <CommandList className="h-[160px] overflow-y-auto">
                <CommandEmpty>Sin resultados</CommandEmpty>
                <CommandGroup>
                  {productionOrders.map((order) => (
                    <CommandItem
                      key={order.id}
                      value={order.name}
                      onSelect={() => {
                        onChange(selectProductionOrder(order));
                        setPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value.productionOrderId === order.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{order.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ProductionOrderLinkField;
