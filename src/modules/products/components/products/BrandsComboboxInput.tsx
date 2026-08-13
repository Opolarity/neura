import { useRef, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/shared/utils/utils";
import type { ProductBrand } from "@/modules/products/types/AddProduct.types";

interface BrandsComboboxInputProps {
  brands: ProductBrand[];
  selectedBrands: number[];
  onSelect: (brandId: number) => void;
  onRemove: (brandId: number) => void;
  onCreateBrand: (name: string) => Promise<ProductBrand | null>;
  disabled?: boolean;
}

// Mismo patrón que TagsComboboxInput (ver ese archivo para el detalle de cada
// decisión): el Popover se ancla con PopoverPrimitive.Anchor + onInteractOutside
// en vez de PopoverTrigger, porque se abre por foco del input y no por click.
const BrandsComboboxInput = ({
  brands,
  selectedBrands,
  onSelect,
  onRemove,
  onCreateBrand,
  disabled = false,
}: BrandsComboboxInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBrandObjects = selectedBrands
    .map(id => brands.find(b => b.id === id))
    .filter((b): b is ProductBrand => Boolean(b));

  const query = search.trim().toLowerCase();
  const suggestions = brands.filter(
    b => !selectedBrands.includes(b.id) && b.name.toLowerCase().includes(query)
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && search) setSearch("");
  };

  const selectExisting = (brand: ProductBrand) => {
    onSelect(brand.id);
    setSearch("");
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace con el input vacío quita el último badge; con texto, borra
    // letra normalmente (no debe borrar badge y letra a la vez).
    if (e.key === "Backspace") {
      if (search === "" && selectedBrandObjects.length > 0) {
        e.preventDefault();
        onRemove(selectedBrandObjects[selectedBrandObjects.length - 1].id);
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
      await onCreateBrand(value);
    } finally {
      setCreating(false);
      setSearch("");
    }
  };

  const handleRemove = (e: React.MouseEvent, brandId: number) => {
    e.stopPropagation();
    onRemove(brandId);
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
          {selectedBrandObjects.map(brand => (
            <Badge key={brand.id} variant="secondary" className="flex items-center gap-1">
              {brand.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, brand.id)}
                  className="rounded-full hover:bg-muted-foreground/20"
                  aria-label={`Quitar ${brand.name}`}
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
            placeholder={selectedBrandObjects.length === 0 ? "Buscar o crear marca..." : ""}
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
            if (containerRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          {suggestions.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">No se encontraron marcas.</p>
          ) : (
            suggestions.map((brand, index) => (
              <button
                key={brand.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectExisting(brand)}
                className={cn(
                  "w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  index === 0 && "bg-muted"
                )}
              >
                {brand.name}
              </button>
            ))
          )}
        </PopoverContent>
      )}
    </Popover>
  );
};

export default BrandsComboboxInput;
