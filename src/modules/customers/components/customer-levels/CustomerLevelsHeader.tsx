import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

interface CustomerLevelsHeaderProps {
  onOpen: () => void;
}

export default function CustomerLevelsHeader({ onOpen }: CustomerLevelsHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <h1 className="text-2xl font-bold text-foreground">Niveles OVTK Crew</h1>

      <ComponentPermission codeIn={["customer_levels.create"]}>
        <Button onClick={onOpen}>
          <Plus className="w-4 h-4" />
          Nuevo nivel
        </Button>
      </ComponentPermission>
    </div>
  );
}
