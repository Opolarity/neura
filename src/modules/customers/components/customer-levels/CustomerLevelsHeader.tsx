import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface CustomerLevelsHeaderProps {
  onOpen: () => void;
}

export default function CustomerLevelsHeader({ onOpen }: CustomerLevelsHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900">Niveles OVTK Crew</h1>
        <p className="text-gray-600">Administra los niveles de fidelización: puntos, descuento y presentación</p>
      </div>

      <ComponentPermission codeIn={["customer_levels.create"]}>
        <Button onClick={onOpen}>
          <Plus className="w-4 h-4" />
          Nuevo nivel
        </Button>
      </ComponentPermission>
    </div>
  );
}
