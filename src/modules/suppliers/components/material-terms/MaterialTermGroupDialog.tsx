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
  MaterialTermGroup,
  SaveMaterialTermGroupData,
} from "../../types/materialTerms.types";

interface MaterialTermGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null = alta. */
  editing: MaterialTermGroup | null;
  saving: boolean;
  onSave: (values: SaveMaterialTermGroupData) => void;
}

/**
 * Alta y edición de un atributo (Color, Largo). El código es opcional: sin él,
 * el backend usa el nombre en mayúsculas.
 */
export const MaterialTermGroupDialog = ({
  open,
  onOpenChange,
  editing,
  saving,
  onSave,
}: MaterialTermGroupDialogProps) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setCode(editing?.code ?? "");
  }, [open, editing]);

  const canSave = name.trim() !== "" && !saving;

  const submit = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), code: code.trim() || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar atributo" : "Nuevo atributo de material"}</DialogTitle>
          <DialogDescription>
            Lo que distingue a dos variaciones del mismo material: Color, Largo, Talla…
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-term-group-name">Nombre *</Label>
            <Input
              id="material-term-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ej: Color"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-term-group-code">Código</Label>
            <Input
              id="material-term-group-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Si lo dejas vacío, se usa el nombre"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={!canSave}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Guardar" : "Crear atributo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialTermGroupDialog;
