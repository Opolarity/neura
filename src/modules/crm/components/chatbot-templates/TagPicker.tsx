import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TagPickerProps {
  id?: string;
  /** Nombres de las etiquetas elegidas. */
  value: string[];
  onChange: (value: string[]) => void;
  /** Nombres de las etiquetas externas que ya existen (las creadas desde el ERP). */
  options: string[];
  /** Por qué no se puede usar ese nombre como extra (una etiqueta de Jev), o null. */
  blocked?: (name: string) => string | null;
  max?: number;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * T-917. Etiquetas extra de una plantilla: solo externas. Se eligen de las
 * creadas desde el ERP o se crea una escribiéndola; una de Jev no se puede
 * (solo va como principal). La etiqueta nueva recién se guarda con la plantilla.
 */
export default function TagPicker({ id, value, onChange, options, blocked, max = 10 }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const text = query.replace(/\s+/g, " ").trim();
  const available = options.filter((o) => !blocked?.(o));
  const exists = available.some((o) => same(o, text)) || value.some((v) => same(v, text));
  const blockedReason = text ? (blocked?.(text) ?? null) : null;
  const full = value.length >= max;

  const toggle = (name: string) => {
    if (value.some((v) => same(v, name))) onChange(value.filter((v) => !same(v, name)));
    else if (!full) onChange([...value, name]);
  };

  const create = () => {
    if (!text || exists || blockedReason || full || text.length > 40) return;
    onChange([...value, text]);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button
              type="button"
              className="rounded-full hover:text-destructive"
              aria-label={`Quitar la etiqueta ${v}`}
              onClick={() => onChange(value.filter((x) => x !== v))}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button id={id} type="button" variant="outline" size="sm" disabled={full}>
              <Plus className="w-4 h-4" />
              Agregar etiqueta
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Busca o escribe una nueva..."
                value={query}
                onValueChange={setQuery}
                maxLength={40}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && text && !exists) {
                    e.preventDefault();
                    create();
                  }
                }}
              />
              <CommandList>
                {blockedReason ? (
                  <p className="px-3 py-2 text-xs text-destructive">{blockedReason}</p>
                ) : (
                  <CommandEmpty>{text ? "No existe todavía." : "No hay etiquetas."}</CommandEmpty>
                )}
                {text && !exists && !blockedReason && (
                  <CommandGroup>
                    <CommandItem value={`__crear__${text}`} onSelect={create}>
                      <Plus className="w-4 h-4" />
                      Crear «{text}»
                    </CommandItem>
                  </CommandGroup>
                )}
                <CommandGroup heading="Etiquetas">
                  {available.map((o) => {
                    const selected = value.some((v) => same(v, o));
                    return (
                      <CommandItem key={o} value={o} onSelect={() => toggle(o)}>
                        <Check className={selected ? "w-4 h-4 opacity-100" : "w-4 h-4 opacity-0"} />
                        {o}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {full && <p className="text-xs text-muted-foreground">Hasta {max} etiquetas extra.</p>}
    </div>
  );
}
