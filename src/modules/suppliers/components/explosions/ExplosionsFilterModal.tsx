import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExplosionsFilters } from "../../types/explosions.types";
import { SimpleCategory } from "@/modules/products/types/Categories.types";

const ALL = "all";

interface ExplosionsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ExplosionsFilters) => void;
  filters: ExplosionsFilters;
  categories: SimpleCategory[];
}

export const ExplosionsFilterModal = ({
  isOpen,
  onClose,
  onApply,
  filters,
  categories,
}: ExplosionsFilterModalProps) => {
  const [localFilters, setLocalFilters] = useState<ExplosionsFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({
      ...localFilters,
      category_id: null,
      without_variation: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar desarrollos</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno: el max-h va en un contenedor propio, no
            en el ScrollArea, que envuelve solo el cuerpo para que cabecera y footer
            queden fuera del scroll. Al ser un máximo la altura se adapta al contenido
            y el scroll solo aparece si hay de sobra, así que sirve el mismo valor en
            todos los modales de filtros. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="explosion-category">Categoría del producto</Label>
                <Select
                  value={
                    localFilters.category_id
                      ? localFilters.category_id.toString()
                      : ALL
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      category_id: value === ALL ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="explosion-category">
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Incluye las subcategorías de la que elijas.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explosion-has-product">Prenda</Label>
                <Select
                  value={
                    localFilters.without_variation === null ||
                    localFilters.without_variation === undefined
                      ? ALL
                      : localFilters.without_variation
                        ? "without"
                        : "with"
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      without_variation:
                        value === ALL ? null : value === "without",
                    })
                  }
                >
                  <SelectTrigger id="explosion-has-product">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los desarrollos</SelectItem>
                    <SelectItem value="with">Solo con prenda</SelectItem>
                    <SelectItem value="without">Solo sin prenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Limpiar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
