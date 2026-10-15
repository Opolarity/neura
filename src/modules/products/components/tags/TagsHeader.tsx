import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface TagsHeaderProps {
  onOpen: () => void;
}

export default function TagsHeader({ onOpen }: TagsHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <h1 className="text-2xl font-bold text-foreground">Gestión de etiquetas</h1>

      <ComponentPermission codeIn={["product_tags.create"]}>
        <Button onClick={onOpen}>
          <Plus className="w-4 h-4" />
          Nueva Etiqueta
        </Button>
      </ComponentPermission>
    </div>
  );
}
