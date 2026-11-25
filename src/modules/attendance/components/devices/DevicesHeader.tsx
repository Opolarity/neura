import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DevicesHeaderProps {
  onEnable: () => void;
}

const DevicesHeader = ({ onEnable }: DevicesHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-foreground">Equipos de marcación</h1>
    <Button onClick={onEnable} className="gap-2">
      <Plus className="w-4 h-4" />
      Habilitar equipo
    </Button>
  </div>
);

export default DevicesHeader;
