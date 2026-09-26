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
import { SimpleCategory } from "@/modules/products/types/Categories.types";
import {
  ProductRecipesFilters,
  RecipeState,
  RecipeStateCounts,
} from "../../types/productRecipes.types";

const ALL = "all";

interface ProductRecipesFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ProductRecipesFilters) => void;
  filters: ProductRecipesFilters;
  categories: SimpleCategory[];
  /** Cuántos productos hay en cada estado, con la búsqueda y la categoría actuales. */
  counts: RecipeStateCounts;
}

export const ProductRecipesFilterModal = ({
  isOpen,
  onClose,
  onApply,
  filters,
  categories,
  counts,
}: ProductRecipesFilterModalProps) => {
  const [categoryId, setCategoryId] = useState<number | null>(filters.category_id ?? null);
  const [recipeState, setRecipeState] = useState<RecipeState | null>(
    filters.recipe_state ?? null
  );

  useEffect(() => {
    setCategoryId(filters.category_id ?? null);
    setRecipeState(filters.recipe_state ?? null);
  }, [filters.category_id, filters.recipe_state]);

  const handleApply = () => {
    onApply({ category_id: categoryId, recipe_state: recipeState });
    onClose();
  };

  const handleClear = () => {
    setCategoryId(null);
    setRecipeState(null);
  };

  const recipeOptions: Array<{ value: string; label: string; count: number }> = [
    { value: ALL, label: "Todos", count: counts.all },
    { value: "WITH", label: "Con receta", count: counts.with },
    { value: "WITHOUT", label: "Sin receta", count: counts.without },
  ];
  // "Por unificar" solo aparece si hay algo que unificar: es un estado de
  // transición de las recetas antiguas, no una categoría permanente.
  if (counts.pending > 0 || recipeState === "PENDING") {
    recipeOptions.push({ value: "PENDING", label: "Por unificar", count: counts.pending });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar productos</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="product-recipe-state">Receta</Label>
                <Select
                  value={recipeState ?? ALL}
                  onValueChange={(value) =>
                    setRecipeState(value === ALL ? null : (value as RecipeState))
                  }
                >
                  <SelectTrigger id="product-recipe-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recipeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-recipe-category">Categoría del producto</Label>
                <Select
                  value={categoryId ? categoryId.toString() : ALL}
                  onValueChange={(value) =>
                    setCategoryId(value === ALL ? null : parseInt(value))
                  }
                >
                  <SelectTrigger id="product-recipe-category">
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
