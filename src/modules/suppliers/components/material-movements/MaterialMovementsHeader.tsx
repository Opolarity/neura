import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const MaterialMovementsHeader = () => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">
        Movimientos de materiales
      </h1>
      {/* El único movimiento que se crea a mano desde aquí: mandar material a
          un taller. Las compras entran solas al recibirse. */}
      <Button asChild className="gap-2">
        <Link to="/suppliers/material-movements/create">
          <Plus className="w-4 h-4" />
          Enviar material a servicio
        </Link>
      </Button>
    </div>
  );
};

export default MaterialMovementsHeader;
