import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PrintTemplatesHeaderProps {
  onCreate: () => void;
}

const PrintTemplatesHeader = ({ onCreate }: PrintTemplatesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">
        Plantillas de impresión
      </h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nueva plantilla
      </Button>
    </div>
  );
};

export default PrintTemplatesHeader;
