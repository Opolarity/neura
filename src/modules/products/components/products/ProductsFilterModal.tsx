import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFilters } from "../../types/Products.types";
import type { TagsResponse } from "@/shared/types/type";
import {
  CategorySelector,
  type CategoryOption,
} from "@/shared/components/category-selector";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useEffect, useState } from "react";

interface ProductsFilterModalProps {
  /**
   * Categorías marcadas. Viajan como objetos y no como ids para conservar el
   * nombre entre aperturas: el catálogo lo pagina el CategorySelector, así que
   * el modal no tiene de dónde volver a resolverlos.
   */
  selectedCategories: CategoryOption[];
  onChangeSelectedCategories: (items: CategoryOption[]) => void;
  /** Etiquetas (tags.type = 'tag'), ya filtradas por useProducts. */
  tags?: TagsResponse[];
  /** Marcas (tags.type = 'brand'), ya filtradas por useProducts. */
  brands?: TagsResponse[];
  filters: ProductFilters;
  isOpen: boolean;
  onClose?: () => void;
  onApply?: (filters: ProductFilters) => void;
}

const getCategoriesLabel = (categories: CategoryOption[]): string => {
  if (categories.length === 0) return "Todas las categorías";
  if (categories.length === 1) return categories[0].name;
  return `${categories.length} categorías`;
};

const ProductsFilterModal = ({
  selectedCategories,
  onChangeSelectedCategories,
  tags = [],
  brands = [],
  filters,
  isOpen,
  onClose,
  onApply,
}: ProductsFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<ProductFilters>(filters);
  // Borrador de la selección: igual que el resto de filtros, solo se confirma
  // al pulsar "Aplicar", no al marcar dentro del popover.
  const [internalCategories, setInternalCategories] =
    useState<CategoryOption[]>(selectedCategories);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
      setInternalCategories(selectedCategories);
    }
  }, [isOpen, filters, selectedCategories]);

  const handleTagChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      tag: value === "none" ? null : Number(value),
    }));
  };

  const handleBrandChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      brand: value === "none" ? null : Number(value),
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
    setInternalCategories([]);
    setInternalFilters({
      page: 1,
      size: filters.size,
      search: null,
      minprice: null,
      maxprice: null,
      category_ids: [],
      status: null,
      web: null,
      minstock: null,
      maxstock: null,
      order: null,
      tag: null,
      brand: null,
    });
  };

  const handleApply = () => {
    onChangeSelectedCategories(internalCategories);
    onApply?.({
      ...internalFilters,
      category_ids: internalCategories.map((category) => category.id),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Productos</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno: los filtros crecen (categorías,
            marcas, etiquetas) y sin esto el modal se estiraba hasta salirse de
            la pantalla, dejando el footer fuera de alcance. El max-h va en un
            contenedor propio, no en el ScrollArea. El pr-4 aparta el contenido
            de la barra de scroll, que si no roza el borde derecho de inputs y
            selects. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categorías</Label>
                <div className="flex gap-2">
                  <CategorySelector
                    selectedItems={internalCategories}
                    onChangeItems={setInternalCategories}
                    trigger={
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between text-left font-normal",
                          internalCategories.length === 0 &&
                            "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">
                          {getCategoriesLabel(internalCategories)}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Marcas</Label>
                <div className="flex gap-2">
                  <Select
                    value={
                      internalFilters?.brand ? String(internalFilters.brand) : "none"
                    }
                    onValueChange={handleBrandChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Todas las marcas</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Etiquetas</Label>
                <div className="flex gap-2">
                  <Select
                    value={
                      internalFilters?.tag ? String(internalFilters.tag) : "none"
                    }
                    onValueChange={handleTagChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las etiquetas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Todas las etiquetas</SelectItem>
                      {tags.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
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
          </ScrollArea>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductsFilterModal;
