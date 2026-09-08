import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainingsHeaderProps {
  onSchedule: () => void;
}

export const TrainingsHeader = ({ onSchedule }: TrainingsHeaderProps) => (
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-3xl font-bold">Capacitaciones</h1>
      <p className="text-muted-foreground mt-1">
        Reuniones agendadas con el equipo de OPOLARITY
      </p>
    </div>
    <div className="flex gap-2">
      <Button onClick={onSchedule}>
        <Plus className="w-4 h-4 mr-2" />
        Agendar capacitación
      </Button>
    </div>
  </div>
);
