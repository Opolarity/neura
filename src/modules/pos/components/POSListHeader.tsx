import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface POSListHeaderProps {
  handleGoToPOS: () => void;
}

const POSListHeader = ({ handleGoToPOS }: POSListHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Sesiones de Caja
        </h1>
        <p className="text-muted-foreground">
          Listado de sesiones POS abiertas y cerradas
        </p>
      </div>
      <div className="flex gap-2">
        {/* El botón lleva a /pos/open, que ya está protegida con pos.open. Se
            reutiliza ese mismo code aquí para no ofrecer un botón que acaba en
            una pantalla bloqueada. */}
        <ComponentPermission codeIn={["pos.open"]}>
          <Button onClick={handleGoToPOS} className="gap-2">
            <Plus className="w-4 h-4" />
            Ir al Punto de Venta
          </Button>
        </ComponentPermission>
      </div>
    </div>
  );
};

export default POSListHeader;
