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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "../../types/Products.types";
import { ProductFilters } from "../../types/Products.types";
import { useEffect, useState } from "react";

interface ProductsFilterModalProps {
  categories: Category[];
  filters: ProductFilters;
  isOpen: boolean;
  onClose?: () => void;
  onApply?: (filters: ProductFilters) => void;
}

const ProductsFilterModal = ({
  categories,
  filters,
  isOpen,
  onClose,
  onApply,
}: ProductsFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<ProductFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleCategoryChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      category: value === "none" ? null : Number(value),
    }));
  };

  const parsePositive = (raw: string) => {
    if (!raw) return null;
    const clean = raw.replace(/-/g, "");
    return clean ? Number(clean) : null;
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, minprice: parsePositive(e.target.value) }));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, maxprice: parsePositive(e.target.value) }));
  };

  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, minstock: parsePositive(e.target.value) }));
  };

  const handleMaxStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, maxstock: parsePositive(e.target.value) }));
  };

  const handleStatusChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      status: value === "none" ? null : value === "true",
    }));
  };

  const handleClear = () => {
    setInternalFilters({
      page: 1,
      size: filters.size,
      search: null,
      minprice: null,
      maxprice: null,
      category: null,
      status: null,
      web: null,
      minstock: null,
      maxstock: null,
      order: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Productos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categorías</Label>
            <div className="flex gap-2">
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
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Precio</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                min={0}
                value={internalFilters.minprice ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={handleMinPriceChange}
              />
              <Input
                type="number"
                placeholder="Máximo"
                min={0}
                value={internalFilters.maxprice ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={handleMaxPriceChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Inventario</Label>
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
          <div className="space-y-2">
            <Label className="text-sm font-medium">Estado</Label>
            <div className="flex gap-2">
              <Select
                value={
                  internalFilters.status == null
                    ? "none"
                    : String(internalFilters.status)
                }
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los estados</SelectItem>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
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

export default ProductsFilterModal;
