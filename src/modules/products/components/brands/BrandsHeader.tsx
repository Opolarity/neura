import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface BrandsHeaderProps {
  onOpen: () => void;
}

export default function BrandsHeader({ onOpen }: BrandsHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <h1 className="text-2xl font-bold text-foreground">Gestión de marcas</h1>

      <ComponentPermission codeIn={["product_brands.create"]}>
        <Button onClick={onOpen}>
          <Plus className="w-4 h-4" />
          Nueva Marca
        </Button>
      </ComponentPermission>
    </div>
  );
}
