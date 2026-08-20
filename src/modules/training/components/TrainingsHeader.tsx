import { GraduationCap, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainingsHeaderProps {
  onSchedule: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const TrainingsHeader = ({
  onSchedule,
  onRefresh,
  refreshing,
}: TrainingsHeaderProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <GraduationCap className="w-8 h-8" />
      <div>
        <h1 className="text-3xl font-bold">Capacitaciones</h1>
        <p className="text-muted-foreground">
          Reuniones agendadas con el equipo de OPOLARITY
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
        Actualizar
      </Button>
      <Button onClick={onSchedule}>
        <Plus className="w-4 h-4 mr-2" />
        Agendar capacitación
      </Button>
    </div>
  </div>
);
