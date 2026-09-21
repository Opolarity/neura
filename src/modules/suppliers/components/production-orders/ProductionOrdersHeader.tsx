import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductionOrdersHeaderProps {
  onCreate: () => void;
}

const ProductionOrdersHeader = ({ onCreate }: ProductionOrdersHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Órdenes de producción</h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nueva Orden
      </Button>
    </div>
  );
};

export default ProductionOrdersHeader;
