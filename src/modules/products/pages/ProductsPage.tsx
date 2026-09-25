import { useRef, useState } from "react";
import type { CategoryOption } from "@/shared/components/category-selector";
import {
  DeselectConfirmDialog,
  SelectedCount,
  useDeselectGuard,
} from "@/shared/components/selection-guard";
import ProductHeader from "../components/products/ProductHeader";
import ProductsTable from "../components/products/ProductsTable";
import ProductsFilterModal from "../components/products/ProductsFilterModal";
import { ProductDeleteDialog } from "../components/products/ProductDeleteDialog";
import { useProducts } from "../hooks/useProducts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import ProductsFilterBar from "../components/products/ProductsFilterBar";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { Product } from "../types/Products.types";

const Products = () => {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    products,
    selectedCategories,
    setSelectedCategories,
    tags,
    brands,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    selectedProducts,
    hasActiveFilters,
    handlePageSizeChange,
    toggleSelectAll,
    toggleProductSelection,
    clearSelection,
    deleteSelectedsProduct,
    deleteSelectedProduct,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    goToNewProduct,
    goToViewProduct,
    onPageChange,
    onSearchChange,
    onOrderChange,
  } = useProducts();

  // Buscar, ordenar o filtrar con líneas seleccionadas pide confirmación y
  // deselecciona; paginar conserva la selección.
  const { guard, dialogProps: deselectDialogProps } = useDeselectGuard();
  const guardSelection = (action: () => void) =>
    guard(selectedProducts.length, clearSelection, action);

  // El modal de filtros entrega las categorías justo antes de onApply: se
  // retienen hasta confirmar para que cancelar no deje los filtros a medias.
  const pendingCategories = useRef<CategoryOption[]>([]);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    await deleteSelectedProduct(productToDelete.id);
    setIsDeleting(false);
    setProductToDelete(null);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ProductHeader
        selectedProducts={selectedProducts}
        handleBulkDelete={deleteSelectedsProduct}
        handleNewProduct={goToNewProduct}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4 space-y-0 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            <ProductsFilterBar
              search={search}
              onSearchChange={(value) =>
                guardSelection(() => onSearchChange(value))
              }
              onOpen={onOpenFilterModal}
              order={filters.order}
              onOrderChange={(order) =>
                guardSelection(() => onOrderChange(order))
              }
              hasActiveFilters={hasActiveFilters}
            />
          </div>
          <SelectedCount count={selectedProducts.length} />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <ProductsTable
            search={search}
            products={products}
            loading={loading}
            selectedProducts={selectedProducts}
            onDeleteClick={handleDeleteClick}
            onViewProduct={goToViewProduct}
            onToggleAllProductsSelection={toggleSelectAll}
            onToggleProductSelection={toggleProductSelection}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <ProductsFilterModal
        isOpen={isOpenFilterModal}
        selectedCategories={selectedCategories}
        onChangeSelectedCategories={(items) => {
          pendingCategories.current = items;
        }}
        tags={tags}
        brands={brands}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={(newFilters) =>
          guardSelection(() => {
            setSelectedCategories(pendingCategories.current);
            onApplyFilter(newFilters);
          })
        }
      />

      <DeselectConfirmDialog {...deselectDialogProps} />

      <ProductDeleteDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        product={productToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Products;
