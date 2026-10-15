import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface PriceListHeaderProps {
  onOpenDialog: () => void;
}

const PriceListHeader = ({ onOpenDialog }: PriceListHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <h1 className="text-2xl font-bold text-foreground">
        Listas de precios
      </h1>

      {/* Aquí no hay ruta de creación que reutilizar: el alta se hace en el
          mismo listado, abriendo PriceListFormDialog en blanco. */}
      <ComponentPermission codeIn={["price_lists.create"]}>
        <Button onClick={onOpenDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Lista de Precios
        </Button>
      </ComponentPermission>
    </div>
  );
};

export default PriceListHeader;
