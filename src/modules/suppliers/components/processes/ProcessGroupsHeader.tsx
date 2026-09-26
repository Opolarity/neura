import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProcessGroupsHeaderProps {
  onCreate: () => void;
}

/**
 * Header del catálogo de PROCESOS (tabla process_group).
 *
 * Un componente por pantalla, aunque el markup sea el mismo que el de
 * Operaciones: es la convención del ERP, no un descuido.
 */
const ProcessGroupsHeader = ({ onCreate }: ProcessGroupsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Procesos</h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nuevo Proceso
      </Button>
    </div>
  );
};

export default ProcessGroupsHeader;
