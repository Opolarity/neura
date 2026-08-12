import { useRef, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/shared/utils/utils";
import type { ProductTag } from "@/modules/products/types/AddProduct.types";

interface TagsComboboxInputProps {
  tags: ProductTag[];
  selectedTags: number[];
  onSelect: (tagId: number) => void;
  onRemove: (tagId: number) => void;
  onCreateTag: (name: string) => Promise<ProductTag | null>;
  disabled?: boolean;
}

// El Popover se abre por foco del input (no por click en un trigger), por eso
// se ancla con PopoverPrimitive.Anchor en vez de PopoverTrigger: un Trigger
// alterna abierto/cerrado en cada click, lo que cerraría el popover si el
// usuario hace click dentro del input para reposicionar el cursor mientras
// ya está escribiendo.
const TagsComboboxInput = ({
  tags,
  selectedTags,
  onSelect,
  onRemove,
  onCreateTag,
  disabled = false,
}: TagsComboboxInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTagObjects = selectedTags
    .map(id => tags.find(t => t.id === id))
    .filter((t): t is ProductTag => Boolean(t));

  const query = search.trim().toLowerCase();
  const suggestions = tags.filter(
    t => !selectedTags.includes(t.id) && t.name.toLowerCase().includes(query)
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && search) setSearch("");
  };

  const selectExisting = (tag: ProductTag) => {
    onSelect(tag.id);
    setSearch("");
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace con el input vacío quita el último badge; con texto, borra
    // letra normalmente (no debe borrar badge y letra a la vez).
    if (e.key === "Backspace") {
      if (search === "" && selectedTagObjects.length > 0) {
        e.preventDefault();
        onRemove(selectedTagObjects[selectedTagObjects.length - 1].id);
      }
      return;
    }

    if (e.key !== "Enter") return;
    e.preventDefault();

    const value = search.trim();
    if (!value || creating) return;

    if (suggestions.length > 0) {
      onSelect(suggestions[0].id);
      setSearch("");
      return;
    }

    setCreating(true);
    try {
      await onCreateTag(value);
    } finally {
      setCreating(false);
      setSearch("");
    }
  };

  const handleRemove = (e: React.MouseEvent, tagId: number) => {
    e.stopPropagation();
    onRemove(tagId);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Anchor asChild>
        <div
          ref={containerRef}
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5",
            disabled && "cursor-not-allowed opacity-60"
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {selectedTagObjects.map(tag => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, tag.id)}
                  className="rounded-full hover:bg-muted-foreground/20"
                  aria-label={`Quitar ${tag.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={search}
            disabled={disabled || creating}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => !disabled && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTagObjects.length === 0 ? "Buscar o crear etiqueta..." : ""}
            className="min-w-[80px] flex-1 border-0 bg-transparent p-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
      </PopoverPrimitive.Anchor>

      {!disabled && (
        <PopoverContent
          align="start"
          className="max-h-[200px] w-[--radix-popover-trigger-width] overflow-y-auto p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Al usar Anchor (no Trigger), Radix no reconoce el contenedor del
            // input como parte del popover: sin este guard, cualquier click o
            // foco dentro del propio input se trataría como "afuera" y lo
            // cerraría apenas se abre.
            if (containerRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          {suggestions.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">No se encontraron etiquetas.</p>
          ) : (
            suggestions.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectExisting(tag)}
                className={cn(
                  "w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  index === 0 && "bg-muted"
                )}
              >
                {tag.name}
              </button>
            ))
          )}
        </PopoverContent>
      )}
    </Popover>
  );
};

export default TagsComboboxInput;
