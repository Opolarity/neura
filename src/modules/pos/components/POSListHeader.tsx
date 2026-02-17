import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
        <Button onClick={handleGoToPOS} className="gap-2">
          <Plus className="w-4 h-4" />
          Ir al POS
        </Button>
      </div>
    </div>
  );
};

export default POSListHeader;
