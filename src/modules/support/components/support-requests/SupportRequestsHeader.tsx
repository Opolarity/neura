import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupportRequestsHeaderProps {
  onNewRequest: () => void;
}

export const SupportRequestsHeader = ({
  onNewRequest,
}: SupportRequestsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        {/* "Soporte" es ahora el grupo del menú; esta pantalla es una de sus
            tres opciones, así que el título es el de la opción. */}
        <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
        <p className="text-muted-foreground">
          Tickets y sugerencias enviados al equipo de OPOLARITY
        </p>
      </div>
      <Button onClick={onNewRequest}>
        <Plus className="w-4 h-4 mr-2" />
        Nueva solicitud
      </Button>
    </div>
  );
};
