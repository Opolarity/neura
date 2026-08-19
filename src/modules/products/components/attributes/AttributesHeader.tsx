import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

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
      {/* Los dos botones van con codes distintos: la pantalla es una, pero
          crear un atributo y crear un término se conceden por separado. Si el
          rol no tiene ninguno de los dos, el contenedor queda vacío y no
          ocupa: es un flex sin alto propio. */}
      <div className="flex gap-2">
        <ComponentPermission codeIn={["product_attributes.create"]}>
          <Button variant="outline" onClick={onNewAttribute} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Atributo
          </Button>
        </ComponentPermission>
        <ComponentPermission codeIn={["product_terms.create"]}>
          <Button onClick={onNewTerm} className="gap-2">
            <List className="w-4 h-4" />
            Añadir Término
          </Button>
        </ComponentPermission>
      </div>
    </div>
  );
};

export default AttributesHeader;
