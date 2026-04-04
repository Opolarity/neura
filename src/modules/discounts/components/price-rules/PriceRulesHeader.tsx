import { Tags, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PriceRulesHeaderProps {
  onNewRule: () => void;
}

export const PriceRulesHeader = ({ onNewRule }: PriceRulesHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Tags className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Reglas de Precios</h1>
          <p className="text-muted-foreground">
            Gestiona las reglas de precios y cupones
          </p>
        </div>
      </div>
      <Button onClick={onNewRule}>
        <Plus className="w-4 h-4 mr-2" />
        Nueva Regla
      </Button>
    </div>
  );
};
