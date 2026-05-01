import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListFilter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMovementRequests } from "../hooks/useMovementRequests";
import MovementRequestsTable from "../components/movement-requests/MovementRequestsTable";
import MovementRequestsFilterModal from "../components/movement-requests/MovementRequestsFilterModal";
import { MovementRequestView } from "../types/MovementRequestList.types";

const MovementRequests = () => {
  const navigate = useNavigate();
  const {
    requests,
    loading,
    view,
    setView,
    situationId,
    setSituationId,
    situations,
    hasActiveFilters,
  } = useMovementRequests();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Traspaso</h1>
          <p className="text-muted-foreground">
            Listado de solicitudes de movimiento de inventario entre almacenes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/inventory/movement-requests/send")}>
            <Plus className="mr-2 h-4 w-4" />
            Enviar Inventario
          </Button>
          <Button onClick={() => navigate("/inventory/movement-requests/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Solicitar Inventario
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Tabs value={view} onValueChange={(v) => setView(v as MovementRequestView)}>
            <TabsList>
              <TabsTrigger value="received">Recibidas</TabsTrigger>
              <TabsTrigger value="sent">Enviadas</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={() => setIsFilterOpen(true)}
            variant={hasActiveFilters ? "default" : "outline"}
            className="gap-2"
          >
            <ListFilter className="w-4 h-4" />
            Filtrar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <MovementRequestsTable requests={requests} loading={loading} />
        </CardContent>
      </Card>

      <MovementRequestsFilterModal
        situations={situations}
        filters={{ view, situation_id: situationId }}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(f) => {
          setSituationId(f.situation_id);
          setIsFilterOpen(false);
        }}
      />
    </div>
  );
};

export default MovementRequests;
