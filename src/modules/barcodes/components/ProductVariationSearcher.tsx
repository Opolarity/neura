import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { VariationOption } from "../types/Barcodes.types";

interface ProductVariationSearcherProps {
  variations: VariationOption[];
  selectedVariationId: number | null;
  onSelect: (variation: VariationOption) => void;
  onClear: () => void;
  disabled?: boolean;
}

const ProductVariationSearcher = ({
  variations,
  selectedVariationId,
  onSelect,
  onClear,
  disabled = false,
}: ProductVariationSearcherProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = selectedVariationId
    ? variations.find((v) => v.variationId === selectedVariationId) ?? null
    : null;

  const filtered = variations.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.productTitle.toLowerCase().includes(q) ||
      v.terms.toLowerCase().includes(q) ||
      v.sku?.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q)
    );
  });

  const handleSelect = (variation: VariationOption) => {
    onSelect(variation);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <Label>Producto *</Label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-medium truncate">{selected.label}</div>
            <div className="text-muted-foreground text-xs flex gap-x-3">
              {selected.sku && <span>SKU: {selected.sku}</span>}
              {selected.stockTypeName && <span>{selected.stockTypeName}</span>}
            </div>
          </div>
          {!disabled && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-start font-normal text-muted-foreground"
              disabled={disabled}
            >
              <Search className="mr-2 h-4 w-4 shrink-0" />
              Buscar producto o SKU...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar producto, variación o SKU..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No se encontraron productos.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((v) => (
                    <CommandItem
                      key={v.variationId}
                      value={v.variationId.toString()}
                      onSelect={() => handleSelect(v)}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="text-sm font-medium truncate w-full">
                        {v.productTitle}
                        {v.terms && ` — ${v.terms}`}
                      </span>
                      <div className="flex gap-x-3 text-xs text-muted-foreground">
                        {v.sku && <span>SKU: {v.sku}</span>}
                        {v.stockTypeName && <span>{v.stockTypeName}</span>}
                      </div>
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

export default ProductVariationSearcher;
