import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProcessesHeaderProps {
  onCreate: () => void;
}

const ProcessesHeader = ({ onCreate }: ProcessesHeaderProps) => {
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

export default ProcessesHeader;
