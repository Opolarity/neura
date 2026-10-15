import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainingsHeaderProps {
  onSchedule: () => void;
}

export const TrainingsHeader = ({ onSchedule }: TrainingsHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-foreground">Capacitaciones</h1>
    <div className="flex gap-2">
      <Button onClick={onSchedule}>
        <Plus className="w-4 h-4 mr-2" />
        Agendar capacitación
      </Button>
    </div>
  </div>
);
