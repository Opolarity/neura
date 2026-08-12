import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import type { Category } from "@/types";

interface CategoryQuickAddFormProps {
  categories: Category[];
  onCreate: (payload: { name: string; parent_category: number | null }) => Promise<boolean>;
}

const CategoryQuickAddForm = ({ categories, onCreate }: CategoryQuickAddFormProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const success = await onCreate({ name: name.trim(), parent_category: parentId });
      if (success) {
        setName("");
        setParentId(null);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant={open ? "default" : "outline"} className="w-full">
          + Agregar categoría
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la categoría"
          disabled={creating}
        />
        <Select
          value={parentId !== null ? String(parentId) : "none"}
          onValueChange={(value) => setParentId(value === "none" ? null : Number(value))}
          disabled={creating}
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoría padre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Categoría padre</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

export default CategoryQuickAddForm;
