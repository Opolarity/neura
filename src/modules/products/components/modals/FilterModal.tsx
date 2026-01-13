import { useState, useEffect } from "react";
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
import { ListFilter } from "lucide-react";
import { Category } from "../../types/Categories.types";
import { ProductFilters } from "../../types/Products.types";

interface FilterModalProps {
  categories: Category[];
  initialFilters?: ProductFilters;
  isOpen: boolean;
  onClose?: () => void;
  onApply?: (newFilters: ProductFilters) => void;
  onClear?: () => void;
}

const FilterModal = ({
  categories,
  initialFilters,
  isOpen,
  onClose,
  onApply,
  onClear,
}: FilterModalProps) => {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Productos</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoría
            </Label>
            <div className="col-span-3">
              <Select
                value={String(filters?.category || "none")}
                onValueChange={(value) => {}}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min_price" className="text-right">
              Precio Min
            </Label>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="max_price" className="text-right">
              Precio Max
            </Label>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minstock" className="text-right">
              Stock Min
            </Label>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxstock" className="text-right">
              Stock Max
            </Label>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Estado</Label>
            <div className="flex items-center space-x-2 col-span-3"></div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Web</Label>
            <div className="flex items-center space-x-2 col-span-3"></div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order" className="text-right">
              Ordenar por
            </Label>
            <div className="col-span-3"></div>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
