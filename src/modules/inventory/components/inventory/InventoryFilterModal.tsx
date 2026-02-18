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
import { useEffect, useState } from "react";
import { InventoryFilters, InventoryTypes } from "../../types/Inventory.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryFilterModalProps {
  typeId: number;
  types: InventoryTypes[];
  filters: InventoryFilters;
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: InventoryFilters) => void;
}

const InventoryFilterModal = ({
  typeId,
  types,
  filters,
  isOpen,
  onClose,
  onApply,
}: InventoryFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<InventoryFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleTypeChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      types: Number(value),
    }));
  };

  const parsePositive = (raw: string) => {
    if (!raw) return null;
    const clean = raw.replace(/-/g, "");
    return clean ? Number(clean) : null;
  };

  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, minstock: parsePositive(e.target.value) }));
  };

  const handleMaxStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, maxstock: parsePositive(e.target.value) }));
  };

  const handleClear = () => {
    setInternalFilters({
      page: 1,
      size: filters.size,
      search: null,
      minstock: null,
      maxstock: null,
      warehouse: null,
      types: typeId,
      order: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Inventario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Stock</Label>
            <div className="flex gap-2">
              <Select
                value={String(internalFilters.types)}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                onChange={handleMinStockChange}
              />
              <Input
                type="number"
                placeholder="Máximo"
                min={0}
                value={internalFilters.maxstock ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={handleMaxStockChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply && onApply(internalFilters)}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryFilterModal;