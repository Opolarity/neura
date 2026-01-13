import FilterModal from "../components/modals/FilterModal";
import ProductHeader from "../components/ProductHeader";
import ProductsTable from "../components/ProductsTable";
import { useProducts } from "../hooks/useProducts";

const Products = () => {
  const {
    products,
    categories,
    loading,
    search,
    page,
    totalPages,
    startRecord,
    endRecord,
    isOpenFilterModal,
    filters,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onPageChange,
    onSearchChange,
  } = useProducts();

  return (
    <div className="space-y-6">
      <ProductHeader />

      <ProductsTable
        products={products}
        loading={loading}
        search={search}
        page={page}
        totalPages={totalPages}
        startRecord={startRecord}
        endRecord={endRecord}
        onOpen={onOpenFilterModal}
        onPageChange={onPageChange}
        onSearchChange={onSearchChange}
      />

      <FilterModal
        isOpen={isOpenFilterModal}
        categories={categories}
        initialFilters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
    </div>
  );
};

export default Products;
