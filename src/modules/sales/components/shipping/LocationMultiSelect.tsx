import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { cn } from "@/shared/utils/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { LocationOption } from "../../types/Shipping.types";
import { normalizeSearch } from "../../utils/shippingZones";

// Los distritos pueden ser cientos si se eligieron varias provincias: se filtra
// a mano (sin el filtro de cmdk) y se muestran como máximo estas opciones.
const MAX_RESULTS = 50;

interface LocationMultiSelectProps {
  options: LocationOption[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel: string;
}

export function LocationMultiSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  invalid = false,
  ariaLabel,
}: LocationMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const selected = useMemo(() => new Set(value), [value]);

  const { items, hidden } = useMemo(() => {
    const query = normalizeSearch(search);
    const matches = query
      ? options.filter((o) => o.search.includes(query))
      : options;
    return {
      items: matches.slice(0, MAX_RESULTS),
      hidden: Math.max(0, matches.length - MAX_RESULTS),
    };
  }, [options, search]);

  const toggle = (id: number) => {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-1.5 py-1",
        disabled && "cursor-not-allowed opacity-50",
        invalid && "border-destructive",
      )}
    >
      {value.map((id) => {
        const option = byId.get(id);
        const label = option?.label ?? `#${id}`;
        return (
          <Badge
            key={id}
            variant="secondary"
            className="gap-1 pr-1 font-normal"
            title={option?.hint ? `${label} — ${option.hint}` : label}
          >
            {label}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== id))}
                className="rounded-sm p-0.5 hover:bg-muted ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Quitar ${label}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        );
      })}

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label={ariaLabel}
            className="h-7 px-1.5 font-normal text-muted-foreground"
          >
            {value.length === 0 ? (
              placeholder
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar..."
            />
            <CommandList>
              <CommandEmpty>No encontrado.</CommandEmpty>
              {items.length > 0 && (
                <CommandGroup>
                  {items.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={String(option.id)}
                      onSelect={() => toggle(option.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selected.has(option.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  ))}
                  {hidden > 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      {hidden} más · escribe para acotar
                    </p>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
