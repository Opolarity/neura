import ProductHeader from "../components/ProductHeader";
import ProductsTable from "../components/ProductsTable";
import { useProducts } from "../hooks/useProducts";
import FilterModal from "../components/modals/FilterModal";

const Products = () => {
  const {
    products,
    loading,
    search,
    onSearchChange,
    isFilterModalOpen,
    handleOpenFilter,
    handleCloseFilter,
    handleApplyFilters,
    handleClearFilters,
    handlePageChange,
    handlePageSizeChange,
    filters,
    pagination,
    error,
  } = useProducts();

  return (
    <div className="space-y-6">
      <ProductHeader />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <ProductsTable
        products={products}
        loading={loading}
        search={search}
        onSearchChange={onSearchChange}
        onOpenFilter={handleOpenFilter}
        pagination={{
          total: pagination?.total_items || 0,
          page: filters.page || 1,
          pageSize: filters.size || 20,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={handleCloseFilter}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        initialFilters={filters}
      />
    </div>
  );
};

export default Products;
