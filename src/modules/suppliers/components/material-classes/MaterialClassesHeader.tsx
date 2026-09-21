import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaterialClassesHeaderProps {
  onCreate: () => void;
}

/** Título y el botón de crear, con el formato de header de `neura-styles`. */
export const MaterialClassesHeader = ({
  onCreate,
}: MaterialClassesHeaderProps) => (
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold text-foreground">
      Clases de materiales
    </h1>
    <Button type="button" onClick={onCreate} className="gap-2">
      <Plus className="h-4 w-4" />
      Nueva clase
    </Button>
  </div>
);

export default MaterialClassesHeader;
