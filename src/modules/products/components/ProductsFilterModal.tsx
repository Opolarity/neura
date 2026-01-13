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
import { Category } from "../types/Products.types";
import { ProductFilters } from "../types/Products.types";

interface ProductsFilterModalProps {
  categories: Category[];
  filters: ProductFilters;
  isOpen: boolean;
  onFilterChange: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => void;
  onClose?: () => void;
  onApply?: () => void;
  onClear?: () => void;
}

const ProductsFilterModal = ({
  categories,
  filters,
  isOpen,
  onFilterChange,
  onClose,
  onApply,
  onClear,
}: ProductsFilterModalProps) => {
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
                value={filters?.category ? String(filters.category) : "none"}
                onValueChange={(value) =>
                  onFilterChange(
                    "category",
                    value === "none" ? null : Number(value)
                  )
                }
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
                value={filters.minprice ?? ""}
                onChange={(e) =>
                  onFilterChange(
                    "minprice",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.maxprice ?? ""}
                onChange={(e) =>
                  onFilterChange(
                    "maxprice",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Inventario</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={filters.minstock ?? ""}
                onChange={(e) =>
                  onFilterChange(
                    "minstock",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.maxstock ?? ""}
                onChange={(e) =>
                  onFilterChange(
                    "maxstock",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Estado</Label>
            <div className="flex gap-2">
              <Select
                value={filters.status == null ? "none" : String(filters.status)}
                onValueChange={(value) =>
                  onFilterChange(
                    "status",
                    value === "none" ? null : value === "true"
                  )
                }
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
          <Button variant="outline" onClick={onClear}>
            Limpiar
          </Button>
          <Button onClick={onApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductsFilterModal;
