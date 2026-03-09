import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMovementRequests } from "../hooks/useMovementRequests";
import MovementRequestsTable from "../components/movement-requests/MovementRequestsTable";

const MovementRequests = () => {
  const navigate = useNavigate();
  const { requests, loading, userWarehouseId } = useMovementRequests();

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
            Nueva Solicitud
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MovementRequestsTable requests={requests} loading={loading} userWarehouseId={userWarehouseId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementRequests;
