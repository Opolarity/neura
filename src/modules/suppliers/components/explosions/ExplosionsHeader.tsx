import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExplosionsHeaderProps {
  /** Crear (o elegir) el producto y seguir a su receta. */
  onCreate: () => void;
}

const ExplosionsHeader = ({ onCreate }: ExplosionsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Recetas</h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nuevo producto
      </Button>
    </div>
  );
};

export default ExplosionsHeader;
