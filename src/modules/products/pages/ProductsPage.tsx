import ProductHeader from "../components/ProductHeader";
import ProductsTable from "../components/ProductsTable";
import ProductsFilterModal from "../components/ProductsFilterModal";
import { useProducts } from "../hooks/useProducts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import ProductsFilterBar from "../components/ProductsFilterBar";
import ProductsPagination from "../components/ProductsPagination";

const Products = () => {
  const {
    products,
    categories,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    tempFilters,
    selectedProducts,
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
    updateTempFilter,
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
          <ProductsPagination
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <ProductsFilterModal
        isOpen={isOpenFilterModal}
        categories={categories}
        filters={tempFilters}
        onFilterChange={updateTempFilter}
        onClose={onCloseFilterModal}
        onApply={() => onApplyFilter(tempFilters)}
      />
    </div>
  );
};

export default Products;
