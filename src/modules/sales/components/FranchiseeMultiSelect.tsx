import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/shared/utils/utils";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Un franquiciado del filtro, ya cruzado con el tenant del otro backend. */
export interface FranchiseeMultiSelectOption {
  /** accounts.id; es el valor que viaja al filtro. */
  id: number;
  /** Nombre comercial de la tienda ("Bultiger Club"). */
  storeName: string;
  /** El franquiciado como cliente de Overtake ("GARB CORP SAC"). */
  accountName: string | null;
  provinceName: string | null;
}

interface FranchiseeMultiSelectProps {
  options: FranchiseeMultiSelectOption[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
}

/**
 * Selector múltiple de franquiciado del modal de filtros de "Productos de
 * franquicia".
 *
 * Es una copia propia del MultiSelect de movements y no ese mismo componente:
 * aquel tipa la opción como `{ label: string; value: string }`, y aquí la
 * opción no es una línea de texto sino un bloque (tienda + dueño + badge de
 * provincia). Tocar el compartido habría cambiado el contrato a todos los
 * módulos que lo usan, así que la variante rica vive aquí.
 *
 * Mismo diseño de opción que FranchiseeSelect (el de "Stock de franquicias"),
 * pero no se puede reutilizar aquel: es un Select de selección única sobre
 * Radix y este es un combobox múltiple con buscador sobre cmdk.
 */

// El badge se pinta con badgeVariants sobre un <span> para no meter un <div>
// dentro del CommandItem, que es inline por dentro. Mismos estilos.
const badgeOutline = badgeVariants({ variant: "outline" });

export function FranchiseeMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Todos los franquiciados",
}: FranchiseeMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: number) => {
    onChange(
      value.includes(id)
        ? value.filter((item) => item !== id)
        : [...value, id],
    );
  };

  const clearAll = () => onChange([]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-10 w-full justify-between px-3"
        >
          {/*
            El trigger muestra solo el nombre de la tienda: los chips son el
            resumen de lo elegido, no la ficha completa de cada franquiciado.
          */}
          <div className="flex flex-1 flex-wrap gap-1 overflow-hidden">
            {value.length > 0 ? (
              value.map((id) => {
                const option = options.find((item) => item.id === id);
                return (
                  <Badge key={id} variant="secondary">
                    {option?.storeName ?? id}
                  </Badge>
                );
              })
            ) : (
              <span className="text-sm font-normal">{placeholder}</span>
            )}
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandEmpty>No encontrado.</CommandEmpty>

          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.id}
                // cmdk filtra por este value. Se le dan los tres datos para
                // poder buscar por tienda, por dueño o por provincia.
                value={[option.storeName, option.accountName, option.provinceName]
                  .filter(Boolean)
                  .join(" ")}
                onSelect={() => toggle(option.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    value.includes(option.id) ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="flex w-full min-w-0 flex-col gap-1">
                  <span className="truncate">{option.storeName}</span>
                  {(option.accountName || option.provinceName) && (
                    <span className="flex w-full min-w-0 items-center gap-1.5">
                      {/* El dueño cede espacio y la provincia no (`shrink-0`):
                          la provincia siempre tiene que verse entera. El
                          truncado es por CSS, el texto completo sigue en el
                          DOM. */}
                      {option.accountName && (
                        <span className="min-w-0 truncate text-xs text-muted-foreground">
                          {option.accountName}
                        </span>
                      )}
                      {option.provinceName && (
                        <span className={cn(badgeOutline, "shrink-0")}>
                          {option.provinceName}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          {value.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={clearAll}
              >
                Limpiar selección
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
