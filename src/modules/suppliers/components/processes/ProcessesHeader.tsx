import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";
import { Download, Loader2, Plus } from "lucide-react";

interface ProcessesHeaderProps {
  /** Crear un bloque de operación (operación padre: Ensamble, Cuello…). */
  onCreateBlock: () => void;
  /** Crear una operación, que se asigna a un bloque. */
  onCreateOperation: () => void;
  /** Exportar a Excel el maestro de operaciones (2026-10-23). */
  onExport: () => void;
  exporting: boolean;
}

const ProcessesHeader = ({ onCreateBlock, onCreateOperation, onExport, exporting }: ProcessesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Operaciones</h1>
      <div className="flex gap-2">
        <TooltipIconButton
          variant="outline"
          onClick={onExport}
          disabled={exporting}
          icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          label={exporting ? "Generando..." : "Exportar Excel"}
        />
        <Button variant="outline" onClick={onCreateBlock} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo bloque
        </Button>
        <Button onClick={onCreateOperation} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva operación
        </Button>
      </div>
    </div>
  );
};

export default ProcessesHeader;
