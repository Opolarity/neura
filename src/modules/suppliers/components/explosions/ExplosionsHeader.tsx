import { Button } from "@/components/ui/button";
import { Copy, Plus } from "lucide-react";

interface ExplosionsHeaderProps {
  /** Crear (o elegir) el producto y seguir a su receta. */
  onCreate: () => void;
  /** Dar la receta de un código de modelo a varios productos a la vez. */
  onAssign: () => void;
}

const ExplosionsHeader = ({ onCreate, onAssign }: ExplosionsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Recetas</h1>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onAssign} className="gap-2">
          <Copy className="w-4 h-4" />
          Asignar receta
        </Button>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Button>
      </div>
    </div>
  );
};

export default ExplosionsHeader;
