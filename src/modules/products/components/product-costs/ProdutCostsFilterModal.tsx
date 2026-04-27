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
import { ProductCostsFilters } from "../../types/ProductCosts.types";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleCategory } from "../../types/Categories.types";

interface ProdutCostsFilterModalProps {
  filters: ProductCostsFilters;
  categories: SimpleCategory[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ProductCostsFilters) => void;
}

const ProdutCostsFilterModal = ({
  filters,
  categories,
  isOpen,
  onClose,
  onApply,
}: ProdutCostsFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<ProductCostsFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
    }
  }, [isOpen, filters]);

  const parsePositive = (raw: string) => {
    if (!raw) return null;
    const clean = raw.replace(/-/g, "");
    return clean ? Number(clean) : null;
  };

  const handleMinCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({
      ...prev,
      mincost: parsePositive(e.target.value),
    }));
  };

  const handleMaxCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({
      ...prev,
      maxcost: parsePositive(e.target.value),
    }));
  };

  const handleCostChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      cost: value === "none" ? null : value === "true",
    }));
  };

  const handleCategoryChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      category: value === "none" ? null : Number(value),
    }));
  };

  const handleClear = () => {
    setInternalFilters({
      page: 1,
      size: filters.size,
      search: null,
      mincost: null,
      maxcost: null,
      order: null,
      cost: null,
      category: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Costos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categorías</Label>
            <Select
              value={
                internalFilters?.category
                  ? String(internalFilters.category)
                  : "none"
              }
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Rango de Costo</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                min={0}
                value={internalFilters.mincost ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={handleMinCostChange}
              />
              <Input
                type="number"
                placeholder="Máximo"
                min={0}
                value={internalFilters.maxcost ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={handleMaxCostChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Costos</Label>
            <div className="flex gap-2">
              <Select
                value={
                  internalFilters.cost == null
                    ? "none"
                    : String(internalFilters.cost)
                }
                onValueChange={handleCostChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas los costos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los costos</SelectItem>
                  <SelectItem value="true">Con costo</SelectItem>
                  <SelectItem value="false">Sin costo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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

export default ProdutCostsFilterModal;
