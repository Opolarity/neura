import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/shared/utils/utils";

export interface ComboboxOption {
  id: number;
  label: string;
  /** Texto completo para el tooltip, cuando `label` va recortada. */
  title?: string;
}

interface EntityComboboxProps {
  options: ComboboxOption[];
  /** Id seleccionado, o null si no hay selección. */
  value: number | null;
  onSelect: (option: ComboboxOption) => void;
  /** Texto del buscador. La búsqueda es server-side: el padre la debouncea. */
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Etiqueta a mostrar cuando el seleccionado no está en `options`. */
  fallbackLabel?: string | null;
  disabled?: boolean;
  className?: string;
}

/**
 * Combobox con búsqueda para elegir una entidad del backend.
 *
 * `shouldFilter={false}` a propósito: las opciones ya vienen filtradas por
 * el servidor, filtrarlas otra vez en cliente escondería resultados.
 */
export const EntityCombobox = ({
  options,
  value,
  onSelect,
  search,
  onSearchChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  fallbackLabel = null,
  disabled = false,
  className,
}: EntityComboboxProps) => {
  const selected = options.find((option) => option.id === value);
  const selectedLabel = selected?.label ?? fallbackLabel ?? "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate" title={selected?.title ?? selectedLabel}>
            {selectedLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={onSearchChange}
          />
          {/* `max-h`, no `h`: con dos opciones la caja medía 160 px igual y
              dejaba media pantalla vacía debajo. Ahora se ajusta a lo que hay
              y solo rueda cuando de verdad no cabe. */}
          <CommandList className="max-h-[260px] overflow-y-auto">
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => onSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate" title={option.title ?? option.label}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
