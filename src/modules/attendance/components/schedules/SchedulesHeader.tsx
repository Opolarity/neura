import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchedulesHeaderProps {
  onCreate: () => void;
}

const SchedulesHeader = ({ onCreate }: SchedulesHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-foreground">Horarios</h1>
    <Button onClick={onCreate} className="gap-2">
      <Plus className="w-4 h-4" />
      Nuevo horario
    </Button>
  </div>
);

export default SchedulesHeader;
