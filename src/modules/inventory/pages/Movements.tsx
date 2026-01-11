import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMovements } from "../hooks/useMovements";
import { MovementsTable } from "../components/movements/MovementsTable";
import { MovementsFilters } from "../components/movements/MovementsFilters";
import { MovementsSummary } from "../components/movements/MovementsSummary";
import { Loader2 } from "lucide-react";

const Movements: React.FC = () => {
  const {
    movements,
    loading,
    filters,
    setFilters,
    summary,
  } = useMovements();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Movimientos de Inventario</h1>
        <p className="text-muted-foreground">
          Historial completo de movimientos de stock
        </p>
      </div>

      <MovementsSummary summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementsFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementsTable movements={movements} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Movements;
