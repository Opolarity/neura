import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SuppliersHeaderProps {
  onCreate: () => void;
}

const SuppliersHeader = ({ onCreate }: SuppliersHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Nuevo Proveedor
      </Button>
    </div>
  );
};

export default SuppliersHeader;
