import { useState } from "react";
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
    categories,
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
    deleteSelectedsProduct,
    deleteSelectedProduct,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    goToNewProduct,
    goToProductDetail,
    onPageChange,
    onSearchChange,
    onOrderChange,
  } = useProducts();

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
    <div className="space-y-6">
      <ProductHeader
        selectedProducts={selectedProducts}
        handleBulkDelete={deleteSelectedsProduct}
        handleNewProduct={goToNewProduct}
      />

      <Card>
        <CardHeader>
          <ProductsFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0">
          <ProductsTable
            search={search}
            products={products}
            loading={loading}
            selectedProducts={selectedProducts}
            onDeleteClick={handleDeleteClick}
            onGoToProductDetail={goToProductDetail}
            onToggleAllProductsSelection={toggleSelectAll}
            onToggleProductSelection={toggleProductSelection}
          />
        </CardContent>

        <CardFooter>
          <PaginationBar pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <ProductsFilterModal
        isOpen={isOpenFilterModal}
        categories={categories}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />

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
