import ProductHeader from "../components/products/ProductHeader";
import ProductsTable from "../components/products/ProductsTable";
import ProductsFilterModal from "../components/products/ProductsFilterModal";
import { useProducts } from "../hooks/useProducts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import ProductsFilterBar from "../components/products/ProductsFilterBar";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

const Products = () => {
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
            onDeleteSelectedProduct={deleteSelectedProduct}
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
    </div>
  );
};

export default Products;
