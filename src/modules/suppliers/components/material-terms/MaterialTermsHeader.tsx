import { List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaterialTermsHeaderProps {
  onCreateGroup: () => void;
  onCreateTerm: () => void;
}

/** Título y los dos altas, con el formato de header de `neura-styles`. */
export const MaterialTermsHeader = ({
  onCreateGroup,
  onCreateTerm,
}: MaterialTermsHeaderProps) => (
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold text-foreground">
      Atributos de materiales
    </h1>
    <div className="flex gap-2">
      <Button type="button" variant="outline" onClick={onCreateGroup} className="gap-2">
        <Plus className="h-4 w-4" />
        Nuevo atributo
      </Button>
      <Button type="button" onClick={onCreateTerm} className="gap-2">
        <List className="h-4 w-4" />
        Nuevo término
      </Button>
    </div>
  </div>
);

export default MaterialTermsHeader;
