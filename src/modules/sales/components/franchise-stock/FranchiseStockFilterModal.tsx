import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import {
  FranchiseCategory,
  FranchiseStockFilters,
} from "../../types/FranchiseStock.types";
import FranchiseCategoryFilter from "./FranchiseCategoryFilter";

interface FranchiseStockFilterModalProps {
  filters: FranchiseStockFilters;
  /** Árbol del franquiciado elegido; llega con la respuesta del stock. */
  categories: FranchiseCategory[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FranchiseStockFilters) => void;
}

const FranchiseStockFilterModal = ({
  filters,
  categories,
  isOpen,
  onClose,
  onApply,
}: FranchiseStockFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<FranchiseStockFilters>(filters);

  useEffect(() => {
    if (isOpen) setInternalFilters(filters);
  }, [isOpen, filters]);

  const parsePositive = (raw: string) => {
    if (!raw) return null;
    const clean = raw.replace(/-/g, "");
    return clean ? Number(clean) : null;
  };

  const handleClear = () => {
    setInternalFilters({
      page: 1,
      size: filters.size,
      search: null,
      order: null,
      minstock: null,
      maxstock: null,
      categories: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar stock</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, mismo patrón que el resto de
            modales de filtros: el ScrollArea envuelve solo el cuerpo, así el
            footer con Limpiar/Aplicar queda siempre visible. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categorías</Label>
                <FranchiseCategoryFilter
                  categories={categories}
                  selected={internalFilters.categories ?? []}
                  onChange={(ids) =>
                    setInternalFilters((prev) => ({
                      ...prev,
                      categories: ids.length > 0 ? ids : null,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Stock</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    min={0}
                    value={internalFilters.minstock ?? ""}
                    onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                    onChange={(e) =>
                      setInternalFilters((prev) => ({
                        ...prev,
                        minstock: parsePositive(e.target.value),
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Máximo"
                    min={0}
                    value={internalFilters.maxstock ?? ""}
                    onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                    onChange={(e) =>
                      setInternalFilters((prev) => ({
                        ...prev,
                        maxstock: parsePositive(e.target.value),
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Se aplica sobre el total del franquiciado, sumando todos sus
                  almacenes.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply(internalFilters)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FranchiseStockFilterModal;
