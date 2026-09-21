import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ProductTag } from "@/modules/products/types/AddProduct.types";

interface TagQuickAddFormProps {
  /**
   * Devuelve la etiqueta creada, o null si no se pudo. Es el mismo contrato
   * que ya usa `TagsComboboxInput`, así que el alta en línea de una pantalla
   * sirve para las dos formas de elegir etiquetas sin escribirla dos veces.
   */
  onCreate: (name: string) => Promise<ProductTag | null>;
  disabled?: boolean;
}

/**
 * Alta en línea de una etiqueta, con la forma de `CategoryQuickAddForm`.
 *
 * Etiquetas y categorías se eligen en el mismo sitio y son la misma decisión
 * --clasificar la prenda--, así que se manejan igual: la lista de casillas
 * arriba y un «+ Agregar» debajo que despliega el alta. Sin selector de padre,
 * que es la única diferencia real: las etiquetas no cuelgan de nada.
 */
const TagQuickAddForm = ({ onCreate, disabled }: TagQuickAddFormProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // Misma convención que CategoryQuickAddForm: aquí `disabled` significa «no
  // lo pintes» --es como la ficha esconde el alta en modo lectura--, no «está
  // ocupado». Lo de estar ocupado lo lleva `creating`.
  if (disabled) return null;

  const handleCreate = async () => {
    const limpio = name.trim();
    if (!limpio) return;
    setCreating(true);
    try {
      const created = await onCreate(limpio);
      if (created) setName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={open ? "default" : "outline"}
          className="w-full justify-center"
        >
          + Agregar
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-3">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la etiqueta"
            disabled={creating}
            className="min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            onClick={handleCreate}
            disabled={name.trim() === "" || creating}
          >
            {creating ? "Creando..." : "Crear"}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TagQuickAddForm;
