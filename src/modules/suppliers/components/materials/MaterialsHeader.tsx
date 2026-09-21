import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MaterialsHeaderProps {
  onCreate: () => void;
}

const MaterialsHeader = ({ onCreate }: MaterialsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Materiales</h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nuevo Material
      </Button>
    </div>
  );
};

export default MaterialsHeader;
