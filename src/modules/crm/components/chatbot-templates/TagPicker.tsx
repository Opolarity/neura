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
  /** Nombres de las etiquetas que ya existen. */
  options: string[];
  /** Nombre que no se puede elegir (la etiqueta principal, que ya va aparte). */
  exclude?: string | null;
  max?: number;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * T-917. Etiquetas extra de una plantilla: se eligen de las existentes o se
 * crea una escribiéndola. La etiqueta nueva recién se guarda con la plantilla.
 */
export default function TagPicker({ id, value, onChange, options, exclude, max = 10 }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const text = query.replace(/\s+/g, " ").trim();
  const available = options.filter((o) => !(exclude && same(o, exclude)));
  const exists = available.some((o) => same(o, text)) || value.some((v) => same(v, text)) || (!!exclude && same(exclude, text));
  const full = value.length >= max;

  const toggle = (name: string) => {
    if (value.some((v) => same(v, name))) onChange(value.filter((v) => !same(v, name)));
    else if (!full) onChange([...value, name]);
  };

  const create = () => {
    if (!text || exists || full || text.length > 40) return;
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
                <CommandEmpty>{text ? "No existe todavía." : "No hay etiquetas."}</CommandEmpty>
                {text && !exists && (
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
