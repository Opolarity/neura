import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "@/shared/hooks/use-toast";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useProductRecipes } from "../hooks/useProductRecipes";
import { ProductRecipesFilterBar } from "../components/explosions/ProductRecipesFilterBar";
import { ProductRecipesFilterModal } from "../components/explosions/ProductRecipesFilterModal";
import { ProductRecipesTable } from "../components/explosions/ProductRecipesTable";
import ExplosionsHeader from "../components/explosions/ExplosionsHeader";
import { ItemProductDialog } from "../components/production-orders/ItemProductDialog";
import { ProductRecipe } from "../types/productRecipes.types";
import { categoriesListApi } from "@/modules/products/services/Categories.service";
import { SimpleCategory } from "@/modules/products/types/Categories.types";

/**
 * "Recetas" (antes "Desarrollo de producto"): los PRODUCTOS con su receta.
 *
 * Antes listaba recetas, y eso escondía justo lo que se viene a buscar aquí:
 * qué productos todavía no tienen receta. Una receta por producto, que cubre
 * todas sus tallas; lo que cambia por prenda va como excepción dentro de ella.
 */
const ExplosionsList = () => {
  const navigate = useNavigate();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);

  const {
    products,
    counts,
    pagination,
    loading,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
  } = useProductRecipes();

  // Las categorías salen del módulo de productos: son las mismas que etiquetan
  // la prenda, no un catálogo propio de desarrollos.
  useEffect(() => {
    categoriesListApi().then(setCategories).catch(console.error);
  }, []);

  const openRecipe = (recipeId: number) => navigate(`/suppliers/explosions/${recipeId}`);

  const createRecipe = (product: ProductRecipe) =>
    navigate(`/suppliers/explosions/new?product=${product.productId}`);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ExplosionsHeader onCreate={() => setProductDialogOpen(true)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <ProductRecipesFilterBar
            search={filters.search ?? ""}
            onSearchChange={handleSearchChange}
            onOpen={() => setFilterModalOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <ProductRecipesTable
            products={products}
            loading={loading}
            onOpenRecipe={openRecipe}
            onCreateRecipe={createRecipe}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <ProductRecipesFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        filters={filters}
        categories={categories}
        counts={counts}
      />

      {/* El producto todavía no existe: se crea como en la orden (o se elige
          uno que ya existe) y se sigue directo a su receta. Se monta al abrir
          para que nazca limpio cada vez. */}
      {productDialogOpen && (
        <ItemProductDialog
          open
          onOpenChange={setProductDialogOpen}
          onSelected={(variations) => {
            const productId = variations[0]?.productId ?? null;
            setProductDialogOpen(false);
            if (productId === null) {
              toast({ title: "No se pudo identificar el producto", variant: "destructive" });
              return;
            }
            navigate(`/suppliers/explosions/new?product=${productId}`);
          }}
        />
      )}
    </div>
  );
};

export default ExplosionsList;
