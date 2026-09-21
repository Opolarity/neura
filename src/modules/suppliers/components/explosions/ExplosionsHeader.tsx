import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ExplosionsHeaderProps {
  onCreate: () => void;
}

const ExplosionsHeader = ({ onCreate }: ExplosionsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Desarrollo de producto</h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nuevo desarrollo
      </Button>
    </div>
  );
};

export default ExplosionsHeader;
