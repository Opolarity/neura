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
import { Package, X, Calendar, User, Hash } from "lucide-react";
import { StockMovementOption } from "../types/Barcodes.types";

interface StockMovementSearcherProps {
  stockMovements: StockMovementOption[];
  selectedId: number | null;
  onSelect: (movement: StockMovementOption | null) => void;
}

const StockMovementSearcher = ({
  stockMovements,
  selectedId,
  onSelect,
}: StockMovementSearcherProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = selectedId
    ? stockMovements.find((sm) => sm.id === selectedId) ?? null
    : null;

  const filtered = stockMovements.filter((sm) => {
    const q = search.toLowerCase();
    return (
      sm.productTitle.toLowerCase().includes(q) ||
      sm.variationTerms.toLowerCase().includes(q) ||
      sm.sku?.toLowerCase().includes(q) ||
      sm.userName.toLowerCase().includes(q) ||
      sm.id.toString().includes(q)
    );
  });

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
      {selected ? (
        <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-3">
          <div className="flex-1 min-w-0 text-sm space-y-1">
            <div className="font-medium truncate">
              #{selected.id} — {selected.productTitle}
              {selected.variationTerms && ` (${selected.variationTerms})`}
            </div>
            <div className="text-muted-foreground text-xs flex flex-wrap gap-x-3">
              <span>Cant: {selected.quantity}</span>
              <span>{new Date(selected.createdAt).toLocaleDateString("es-PE")}</span>
              <span>{selected.userName}</span>
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
              <CommandList>
                <CommandEmpty>No se encontraron movimientos.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((sm) => (
                    <CommandItem
                      key={sm.id}
                      value={sm.id.toString()}
                      onSelect={() => handleSelect(sm)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{sm.id}</span>
                        <span className="text-sm truncate">
                          {sm.productTitle}
                          {sm.variationTerms && ` — ${sm.variationTerms}`}
                        </span>
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

export default StockMovementSearcher;
