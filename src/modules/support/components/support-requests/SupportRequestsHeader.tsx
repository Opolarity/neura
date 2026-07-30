import { LifeBuoy, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupportRequestsHeaderProps {
  onNewRequest: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const SupportRequestsHeader = ({
  onNewRequest,
  onRefresh,
  refreshing,
}: SupportRequestsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Soporte</h1>
          <p className="text-muted-foreground">
            Tickets y sugerencias enviados al equipo de OPOLARITY
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button onClick={onNewRequest}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva solicitud
        </Button>
      </div>
    </div>
  );
};
