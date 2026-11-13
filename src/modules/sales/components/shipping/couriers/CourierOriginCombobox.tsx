import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/shared/utils/utils";
import type { CourierOption } from "../../../types/Couriers.types";

const MAX_RESULTS = 60;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

interface CourierOriginComboboxProps {
  options: CourierOption[];
  value: string | null;
  /** Nombre guardado, para mostrarlo antes de que cargue el catálogo. */
  fallbackLabel?: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

/**
 * Agencia de origen con buscador: Olva y Shalom tienen cientos de agencias, un
 * select plano no sirve. Se busca por departamento, provincia, distrito,
 * nombre o dirección.
 */
export function CourierOriginCombobox({
  options,
  value,
  fallbackLabel,
  onSelect,
  disabled,
}: CourierOriginComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.value === value);

  const results = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean);
    const matches = words.length
      ? options.filter((o) => {
          const text = normalize(`${o.label} ${o.hint ?? ""}`);
          return words.every((w) => text.includes(w));
        })
      : options;
    return matches.slice(0, MAX_RESULTS);
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate" title={selected?.hint ?? undefined}>
            {selected?.label ?? fallbackLabel ?? "Selecciona la agencia de origen"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Busca por distrito, provincia o agencia..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {results.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.hint && (
                      <span className="truncate text-xs text-muted-foreground">{option.hint}</span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
