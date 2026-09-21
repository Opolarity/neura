import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface QuotationsHeaderProps {
  onCreate: () => void;
}

const QuotationsHeader = ({ onCreate }: QuotationsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nueva Cotización
      </Button>
    </div>
  );
};

export default QuotationsHeader;
