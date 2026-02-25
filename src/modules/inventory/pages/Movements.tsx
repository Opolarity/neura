import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

import { useMovements } from "../hooks/useMovements";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import MovementsTable from "../components/movements/MovementsTable";
import MovementsFilterBar from "../components/movements/MovementsFilterBar";
import MovementsFilterModal from "../components/movements/MovementsFilterModal";

const Movements = () => {
  const {
    movements,
    movementsTypes,
    warehouses,
    users,
    loading,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    hasActiveFilters,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilterModal,
    onSearchChange,
    onPageChange,
    onPageSizeChange,
  } = useMovements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movimientos de Inventario</h1>
          <p className="text-muted-foreground">
            Historial completo de movimientos de stock
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <MovementsFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            hasActiveFilters={hasActiveFilters}
            order={filters.order || "desc"}
            onOrderChange={onOrderChange}
          />
        </CardHeader>

        <CardContent className="p-0">
          <MovementsTable movements={movements} loading={loading} />
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <MovementsFilterModal
        filters={filters}
        warehouses={warehouses}
        users={users}
        movementsTypes={movementsTypes}
        isOpen={isOpenFilterModal}
        onClose={onCloseFilterModal}
        onApply={onApplyFilterModal}
      />
    </div>
  );
};

export default Movements;