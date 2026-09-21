import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useProductionOrders } from "../hooks/useProductionOrders";
import { ProductionOrdersFilterBar } from "../components/production-orders/ProductionOrdersFilterBar";
import { ProductionOrdersFilterModal } from "../components/production-orders/ProductionOrdersFilterModal";
import { ProductionOrdersTable } from "../components/production-orders/ProductionOrdersTable";
import { productionOrderClassesApi } from "../services/productionOrders.service";
import {
  ProductionOrder,
  ProductionOrderClassOption,
} from "../types/productionOrders.types";
import ProductionOrdersHeader from "../components/production-orders/ProductionOrdersHeader";

const ProductionOrdersList = () => {
  const navigate = useNavigate();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [classes, setClasses] = useState<ProductionOrderClassOption[]>([]);

  const {
    orders,
    pagination,
    loading,
    search,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
  } = useProductionOrders();

  // Catálogo para el modal de filtros
  useEffect(() => {
    productionOrderClassesApi().then(setClasses).catch(console.error);
  }, []);

  const openEdit = (order: ProductionOrder) =>
    navigate(`/suppliers/production-orders/${order.id}`);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ProductionOrdersHeader
        onCreate={() => navigate("/suppliers/production-orders/new")}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader>
          <ProductionOrdersFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={() => setFilterModalOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ProductionOrdersTable
              orders={orders}
              loading={loading}
              onEdit={openEdit}
            />
          </div>
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      <ProductionOrdersFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        filters={filters}
        classes={classes}
      />
    </div>
  );
};

export default ProductionOrdersList;
