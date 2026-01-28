import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

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
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Ventas</h1>
        <p className="text-muted-foreground mt-1">
          Administra las ventas realizadas
        </p>
      </div>
      <div className="flex gap-2">
        {selectedSales.length > 0 && handleBulkDelete && (
          <Button
            variant="destructive"
            onClick={() => handleBulkDelete(selectedSales)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar ({selectedSales.length})
          </Button>
        )}
        <Button onClick={handleNewSale}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </Button>
      </div>
    </div>
  );
};

export default SalesHeader;
