import { Eye, Loader2, Plus } from "lucide-react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductRecipe, RecipeState } from "../../types/productRecipes.types";

interface ProductRecipesTableProps {
  products: ProductRecipe[];
  loading: boolean;
  /** Abre una receta: la del producto, o una de las que están por unificar. */
  onOpenRecipe: (recipeId: number) => void;
  onCreateRecipe: (product: ProductRecipe) => void;
}

const STATE_BADGE: Record<RecipeState, { label: string; variant: BadgeProps["variant"] }> = {
  WITH: { label: "Con receta", variant: "success" },
  WITHOUT: { label: "Sin receta", variant: "pending" },
  PENDING: { label: "Por unificar", variant: "warning" },
};

const COLUMNS = 6;

export const ProductRecipesTable = ({
  products,
  loading,
  onOpenRecipe,
  onCreateRecipe,
}: ProductRecipesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Categorías</TableHead>
          <TableHead className="w-36">Receta</TableHead>
          <TableHead>Molde</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="w-36" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMNS} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando productos...
              </div>
            </TableCell>
          </TableRow>
        ) : products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMNS} className="text-center text-muted-foreground p-10">
              No se encontraron productos
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => {
            const state = STATE_BADGE[product.recipeState];
            const recipe = product.recipe;

            return (
              <TableRow key={product.productId}>
                <TableCell>
                  <div className="font-medium">{product.productTitle || "—"}</div>
                  {product.productCode && (
                    <div className="text-xs text-muted-foreground">{product.productCode}</div>
                  )}
                </TableCell>

                <TableCell>
                  {product.categories.length === 0 ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {product.categories.map((category) => (
                        <Badge key={category.id} variant="outline">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={state.variant}>{state.label}</Badge>
                </TableCell>

                {/* Solo el código del molde de la receta. */}
                <TableCell className="tabular-nums">
                  {recipe?.modelCode ?? <span className="text-muted-foreground">—</span>}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {recipe ? recipe.total.toFixed(2) : "—"}
                </TableCell>

                <TableCell>
                  <div className="flex justify-end gap-2">
                    {recipe ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => onOpenRecipe(recipe.id)}
                        title={`Ver la receta de ${product.productTitle}`}
                      >
                        <Eye className="w-4 h-4" />
                        Ver receta
                      </Button>
                    ) : product.pendingRecipes.length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => onOpenRecipe(product.pendingRecipes[0].id)}
                        title="Abrir las recetas por unificar y elegir cuál queda"
                      >
                        <Eye className="w-4 h-4" />
                        Unificar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => onCreateRecipe(product)}
                        title={`Crear la receta de ${product.productTitle}`}
                      >
                        <Plus className="w-4 h-4" />
                        Crear receta
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
