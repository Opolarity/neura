import { useState, useEffect, useRef, useCallback } from "react";
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
import { Search, X, Loader2 } from "lucide-react";
import { VariationOption } from "../types/Barcodes.types";
import { searchBarcodeVariations } from "../services/Barcodes.service";
import { variationsFromRpcAdapter } from "../adapters/Barcodes.adapter";

interface ProductVariationSearcherProps {
  selectedVariation: VariationOption | null;
  onSelect: (variation: VariationOption) => void;
  onClear: () => void;
  disabled?: boolean;
}

const ProductVariationSearcher = ({
  selectedVariation,
  onSelect,
  onClear,
  disabled = false,
}: ProductVariationSearcherProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<VariationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.ceil(pagination.total / pagination.size);

  const loadData = useCallback(async (p: number, q: string) => {
    try {
      setLoading(true);
      const res = await searchBarcodeVariations({ page: p, size: 10, search: q || undefined });
      setResults(variationsFromRpcAdapter(res.data));
      setPagination(res.page);
    } catch (err) {
      console.error("Error loading variations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on open
  useEffect(() => {
    if (open) {
      setPage(1);
      setSearch("");
      loadData(1, "");
    }
  }, [open, loadData]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadData(1, search);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, open, loadData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(newPage, search);
  };

  const handleSelect = (variation: VariationOption) => {
    onSelect(variation);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <Label>Producto *</Label>
      {selectedVariation ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-medium truncate">{selectedVariation.label}</div>
            <div className="text-muted-foreground text-xs flex gap-x-3">
              {selectedVariation.sku && <span>SKU: {selectedVariation.sku}</span>}
              {selectedVariation.stockTypeName && <span>{selectedVariation.stockTypeName}</span>}
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
        <Popover open={open} onOpenChange={disabled ? undefined : setOpen} modal={false}>
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
              <CommandList className="max-h-[300px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No se encontraron productos.</CommandEmpty>
                    <CommandGroup>
                      {results.map((v) => (
                        <CommandItem
                          key={v.variationId}
                          value={v.variationId.toString()}
                          onSelect={() => handleSelect(v)}
                          className="flex flex-col items-start gap-0.5 py-2"
                        >
                          <span className="text-sm font-medium truncate w-full">
                            {v.label}
                          </span>
                          <div className="flex gap-x-3 text-xs text-muted-foreground">
                            {v.sku && <span>SKU: {v.sku}</span>}
                            {v.stockTypeName && <span>{v.stockTypeName}</span>}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50">
                  <span className="text-xs text-muted-foreground">
                    {(page - 1) * pagination.size + 1}-
                    {Math.min(page * pagination.size, pagination.total)}{" "}
                    de {pagination.total}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1 || loading}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages || loading}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ProductVariationSearcher;
