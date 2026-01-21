import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";

interface AttributesHeaderProps {
  onNewAttribute: () => void;
  onNewTerm: () => void;
}

const AttributesHeader = ({
  onNewAttribute,
  onNewTerm,
}: AttributesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Listado de Atributos
        </h1>
        <p className="text-muted-foreground">
          Administra los atributos y sus valores
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onNewAttribute} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Atributo
        </Button>
        <Button onClick={onNewTerm} className="gap-2">
          <List className="w-4 h-4" />
          Añadir Término
        </Button>
      </div>
    </div>
  );
};

export default AttributesHeader;
