import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/utils";
import { EditorTooltip } from "./editor-tooltip";

export interface ModeOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

/**
 * El selector de modo al extremo derecho de un InputGroup (ancho, alto,
 * separación...). Va como hijo directo del grupo: el botón ocupa todo su hueco,
 * separado por una línea, y muestra el icono del modo; abre las opciones en un
 * popover. El grupo lleva overflow-hidden para que el hover respete el borde.
 */
export function ModeSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  /** El nombre de la propiedad, para los lectores de pantalla. */
  label: string;
  options: readonly ModeOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* El tooltip pisa el data-state del popover: abierto se marca con
          aria-expanded. */}
      <EditorTooltip label={current.label}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={`${label}: ${current.label}`}
            className="flex h-full w-8 shrink-0 items-center justify-center border-l border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            {current.icon}
          </button>
        </PopoverTrigger>
      </EditorTooltip>
      <PopoverContent align="end" className="w-auto p-1">
        <div role="listbox" aria-label={label} className="flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm px-2 text-left text-[12px] hover:bg-accent hover:text-accent-foreground",
                option.value === value && "font-medium",
              )}
            >
              {option.icon}
              <span className="flex-1">{option.label}</span>
              <Check
                className={cn(
                  "h-3.5 w-3.5",
                  option.value !== value && "invisible",
                )}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
