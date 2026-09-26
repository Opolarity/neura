import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialClass } from "../../types/materials.types";
import { MaterialClassNode } from "../../utils/materialClassTree";

interface MaterialClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null = alta. Con valor, se edita esa clase. */
  editing: MaterialClass | null;
  /** El árbol aplanado, para elegir de qué clase cuelga. */
  tree: MaterialClassNode[];
  saving: boolean;
  onSave: (name: string, parentClassId: number | null) => void;
}

/**
 * Alta y edición de una clase, en el mismo formulario.
 *
 * El `code` no se pide ni se edita: en el módulo MAT marca las raíces canónicas
 * (MAT-TELA, MAT-AVIOS) y renombrarlas desde aquí rompería a quien las busca
 * por código.
 */
export const MaterialClassFormDialog = ({
  open,
  onOpenChange,
  editing,
  tree,
  saving,
  onSave,
}: MaterialClassFormDialogProps) => {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("none");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setParentId(
      editing?.parent_class_id ? String(editing.parent_class_id) : "none",
    );
  }, [open, editing]);

  /**
   * Una clase no puede colgar de sí misma ni de su propia descendencia: sería
   * un ciclo, y el árbol dejaría de poder dibujarse.
   */
  const descendientes = new Set<number>();
  if (editing) {
    descendientes.add(editing.id);
    // El árbol viene aplanado en orden de pintado, así que los hijos de una
    // clase son las filas siguientes con nivel mayor que el suyo.
    const desde = tree.findIndex((nodo) => nodo.id === editing.id);
    if (desde !== -1) {
      const nivel = tree[desde].level;
      for (let i = desde + 1; i < tree.length && tree[i].level > nivel; i++) {
        descendientes.add(tree[i].id);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar clase" : "Nueva clase de material"}
          </DialogTitle>
          <DialogDescription>
            De qué familia cuelga decide dónde se ve en el catálogo y cómo se
            agrupan las líneas en el papel del taller. Los colores, tallas y
            medidas no son clases: van como términos en Atributos de materiales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-class-name">Nombre *</Label>
            <Input
              id="material-class-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Jersey"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && name.trim() && !saving) {
                  onSave(name.trim(), parentId === "none" ? null : Number(parentId));
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Familia</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Ninguna (es una familia)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna (es una familia)</SelectItem>
                {/* Solo FAMILIAS (las raíces): las clases tienen dos niveles,
                    Familia › Clase. El tercero era donde se colaban colores y
                    tallas, que ahora son términos de las variaciones. La base lo
                    impide también (trg_classes_mat_max_depth). */}
                {tree
                  .filter((nodo) => nodo.level === 0 && !descendientes.has(nodo.id))
                  .map((nodo) => (
                    <SelectItem key={nodo.id} value={String(nodo.id)}>
                      <span style={{ paddingLeft: `${nodo.level * 12}px` }}>
                        {nodo.level > 0 && (
                          <span className="text-muted-foreground mr-1 text-xs">
                            └
                          </span>
                        )}
                        {nodo.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave(name.trim(), parentId === "none" ? null : Number(parentId))
            }
            disabled={saving || !name.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : editing ? (
              "Guardar cambios"
            ) : (
              "Crear clase"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialClassFormDialog;
