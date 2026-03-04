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
import { Package, X, Calendar, User, Hash, Loader2 } from "lucide-react";
import { StockMovementOption } from "../types/Barcodes.types";
import { searchBarcodeMovements } from "../services/Barcodes.service";
import { stockMovementsFromRpcAdapter } from "../adapters/Barcodes.adapter";

interface StockMovementSearcherProps {
  selectedMovement: StockMovementOption | null;
  onSelect: (movement: StockMovementOption | null) => void;
}

const StockMovementSearcher = ({
  selectedMovement,
  onSelect,
}: StockMovementSearcherProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StockMovementOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.ceil(pagination.total / pagination.size);

  const loadData = useCallback(async (p: number, q: string) => {
    try {
      setLoading(true);
      const res = await searchBarcodeMovements({ page: p, size: 10, search: q || undefined });
      setResults(stockMovementsFromRpcAdapter(res.data));
      setPagination(res.page);
    } catch (err) {
      console.error("Error loading movements:", err);
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

  const handleSelect = (movement: StockMovementOption) => {
    onSelect(movement);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onSelect(null);
  };

  return (
    <div className="space-y-2">
      <Label>Movimiento de Stock (opcional)</Label>
      {selectedMovement ? (
        <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-3">
          <div className="flex-1 min-w-0 text-sm space-y-1">
            <div className="font-medium truncate">
              #{selectedMovement.id} — {selectedMovement.productTitle}
              {selectedMovement.variationTerms && ` (${selectedMovement.variationTerms})`}
            </div>
            <div className="text-muted-foreground text-xs flex flex-wrap gap-x-3">
              <span>Cant: {selectedMovement.quantity}</span>
              <span>{new Date(selectedMovement.createdAt).toLocaleDateString("es-PE")}</span>
              <span>{selectedMovement.userName}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-start font-normal text-muted-foreground"
            >
              <Package className="mr-2 h-4 w-4 shrink-0" />
              Buscar movimiento de stock...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar por producto, SKU, usuario o ID..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList className="max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No se encontraron movimientos.</CommandEmpty>
                    <CommandGroup>
                      {results.map((sm) => {
                        const displayName = sm.variationTerms
                          ? `${sm.productTitle} (${sm.variationTerms})`
                          : sm.productTitle;
                        return (
                          <CommandItem
                            key={sm.id}
                            value={sm.id.toString()}
                            onSelect={() => handleSelect(sm)}
                            className="flex flex-col items-start gap-1 py-3"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm">{sm.id}</span>
                              <span className="text-sm truncate">{displayName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground pl-5">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Cant: {sm.quantity}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(sm.createdAt).toLocaleDateString("es-PE")}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {sm.userName}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
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

export default StockMovementSearcher;
