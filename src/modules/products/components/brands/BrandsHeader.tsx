import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BrandsHeaderProps {
  onOpen: () => void;
}

export default function BrandsHeader({ onOpen }: BrandsHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Marcas</h1>
        <p className="text-gray-600">Administra tu catálogo de marcas</p>
      </div>

      <Button onClick={onOpen}>
        <Plus className="w-4 h-4" />
        Nueva Marca
      </Button>
    </div>
  );
}
