import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface SalesHeaderProps {
  selectedSales: number[];
  handleNewSale: () => void;
  handleBulkDelete?: (ids: number[]) => void;
}

const SalesHeader = ({
  selectedSales,
  handleNewSale,
  handleBulkDelete,
}: SalesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Gestión de ventas</h1>
      <div className="flex gap-2">
        {/* El borrado masivo se queda SIN envolver a propósito: handleBulkDelete
            es opcional y hoy no lo pasa nadie, así que este botón no llega a
            renderizarse nunca. No existe un code sales.delete en el catálogo y
            crear uno para una acción que no funciona sería añadir una casilla
            muerta en Roles. Cuando se cablee el borrado habrá que crear el code
            y envolverlo aquí. */}
        {selectedSales.length > 0 && handleBulkDelete && (
          <Button
            variant="destructive"
            onClick={() => handleBulkDelete(selectedSales)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar ({selectedSales.length})
          </Button>
        )}
        <ComponentPermission codeIn={["sales.create"]}>
          <Button onClick={handleNewSale}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </ComponentPermission>
      </div>
    </div>
  );
};

export default SalesHeader;
