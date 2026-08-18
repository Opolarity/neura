import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface TagsHeaderProps {
  onOpen: () => void;
}

export default function TagsHeader({ onOpen }: TagsHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Etiquetas</h1>
        <p className="text-gray-600">Administra tu catálogo de etiquetas</p>
      </div>

      <ComponentPermission codeIn={["product_tags.create"]}>
        <Button onClick={onOpen}>
          <Plus className="w-4 h-4" />
          Nueva Etiqueta
        </Button>
      </ComponentPermission>
    </div>
  );
}
