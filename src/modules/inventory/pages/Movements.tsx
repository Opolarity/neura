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
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Fecha inicio"
                value={filters.start_date || ""}
                onChange={(e) => onDateChange("start", e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Fecha fin"
                value={filters.end_date || ""}
                onChange={(e) => onDateChange("end", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {(search || filters.start_date || filters.end_date) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

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
        isOpen={isOpenFilterModal}
        onClose={onCloseFilterModal}
        onApply={onApplyFilterModal}
      />
    </div>
  );
};

export default Movements;
