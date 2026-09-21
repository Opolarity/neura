import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useMaterialMovements } from "../hooks/useMaterialMovements";
import MaterialMovementsHeader from "../components/material-movements/MaterialMovementsHeader";
import MaterialMovementsFilterBar from "../components/material-movements/MaterialMovementsFilterBar";
import MaterialMovementsFilterModal from "../components/material-movements/MaterialMovementsFilterModal";
import MaterialMovementsTable from "../components/material-movements/MaterialMovementsTable";
import MaterialMovementsDetailModal from "../components/material-movements/MaterialMovementsDetailModal";

const MaterialMovements = () => {
  const [searchParams] = useSearchParams();
  const {
    movements,
    movementTypes,
    warehouses,
    materialClasses,
    stockTypes,
    loading,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    hasActiveFilters,
    selectedMovementId,
    detail,
    detailLoading,
    detailError,
    onViewDetail,
    onCloseDetail,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilterModal,
    onOrderChange,
    onPageChange,
    onPageSizeChange,
  } = useMaterialMovements();

  // Entrada desde el inventario: "ver los movimientos de ESTE material".
  const materialIdParam = searchParams.get("material_id");

  useEffect(() => {
    if (!materialIdParam) return;
    const materialId = Number(materialIdParam);
    if (Number.isNaN(materialId) || filters.material_id === materialId) return;
    onApplyFilterModal({ ...filters, material_id: materialId });
  }, [materialIdParam]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <MaterialMovementsHeader />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <MaterialMovementsFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order || "date-desc"}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <MaterialMovementsTable
            movements={movements}
            loading={loading}
            onViewDetail={onViewDetail}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <MaterialMovementsFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        movementTypes={movementTypes}
        materialClasses={materialClasses}
        warehouses={warehouses}
        stockTypes={stockTypes}
        onClose={onCloseFilterModal}
        onApply={onApplyFilterModal}
      />

      <MaterialMovementsDetailModal
        movementId={selectedMovementId}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onClose={onCloseDetail}
      />
    </div>
  );
};

export default MaterialMovements;
