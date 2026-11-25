import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PointsHeaderProps {
  onCreate: () => void;
}

const PointsHeader = ({ onCreate }: PointsHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-foreground">Puntos de marcación</h1>
    <Button onClick={onCreate} className="gap-2">
      <Plus className="w-4 h-4" />
      Nuevo punto
    </Button>
  </div>
);

export default PointsHeader;
