import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";

interface PriceListHeaderProps {
  onOpenDialog: () => void;
}

const PriceListHeader = ({ onOpenDialog }: PriceListHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-2">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Listas de Precios
        </h1>
        <p className="text-muted-foreground">
          Gestiona las listas de precios del sistema
        </p>
      </div>

      <Button onClick={onOpenDialog} className="gap-2">
        <Plus className="w-4 h-4" />
        Nueva Lista de Precios
      </Button>
    </div>
  );
};

export default PriceListHeader;
