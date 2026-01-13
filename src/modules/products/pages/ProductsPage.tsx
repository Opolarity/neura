import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FilterModal from "../components/modals/FilterModal";
import ProductHeader from "../components/ProductHeader";
import ProductsTable from "../components/ProductsTable";
import { useProducts } from "../hooks/useProducts";
import { useState } from "react";

const Products = () => {
  const {
    products,
    categories,
    loading,
    search,
    pagination,
    totalPages,
    startRecord,
    endRecord,
    isOpenFilterModal,
    filters,
    tempFilters,
    updateTempFilter,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onPageChange,
    onSearchChange,
    handlePageSizeChange,
  } = useProducts();

  return (
    <div className="space-y-6">
      <ProductHeader />

      <ProductsTable
        products={products}
        loading={loading}
        search={search}
        page={pagination}
        PageSizeChange={handlePageSizeChange}
        onOpen={onOpenFilterModal}
        onPageChange={onPageChange}
        onSearchChange={onSearchChange}
      />

      <FilterModal
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
