import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Package,
  TrendingDown,
  TrendingUp,
  Search,
  Calendar,
  Loader2,
} from "lucide-react";

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
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilterModal,
    onSearchChange,
    onPageChange,
    onPageSizeChange,
    onDateChange,
    clearFilters,
  } = useMovements();

  if (loading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Movimientos de Inventario
        </h1>
        <p className="text-muted-foreground">
          Historial completo de movimientos de stock
        </p>
      </div>

      <Card>
        <CardHeader>
          <MovementsFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
          />
        </CardHeader>

        <CardContent className="p-0">
          <MovementsTable movements={movements} />
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