import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import type { ProductBrand } from "@/modules/products/types/AddProduct.types";

interface BrandQuickAddFormProps {
  onCreate: (name: string) => Promise<ProductBrand | null>;
}

// Mismo patrón que CategoryQuickAddForm, sin el selector de padre: las marcas
// son filas de `tags` con type = 'brand' y esa tabla no tiene jerarquía.
const BrandQuickAddForm = ({ onCreate }: BrandQuickAddFormProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await onCreate(name.trim());
      if (created) setName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant={open ? "default" : "outline"} className="w-full">
          + Agregar marca
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (name.trim() !== "" && !creating) handleCreate();
          }}
          placeholder="Nombre de la marca"
          disabled={creating}
        />
        <Button
          type="button"
          variant="default"
          className="w-full"
          disabled={name.trim() === "" || creating}
          onClick={handleCreate}
        >
          Crear
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BrandQuickAddForm;
