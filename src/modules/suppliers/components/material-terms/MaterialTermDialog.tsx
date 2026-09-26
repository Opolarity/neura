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
import {
  MaterialTermGroup,
  MaterialTerm,
  SaveMaterialTermData,
} from "../../types/materialTerms.types";

interface MaterialTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null = alta. */
  editing: MaterialTerm | null;
  /** El atributo con el que se abre (desde su fila, o el del término editado). */
  groupId: number | null;
  groups: MaterialTermGroup[];
  saving: boolean;
  onSave: (values: SaveMaterialTermData) => void;
}

/**
 * Alta y edición de un término (Negro, 14 cm). Al editar no se cambia de
 * atributo: un "Negro" que pasara a ser un largo dejaría mal nombradas las
 * variaciones que ya lo llevan.
 */
export const MaterialTermDialog = ({
  open,
  onOpenChange,
  editing,
  groupId,
  groups,
  saving,
  onSave,
}: MaterialTermDialogProps) => {
  const [name, setName] = useState("");
  const [group, setGroup] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setGroup(groupId ? String(groupId) : "");
  }, [open, editing, groupId]);

  const canSave = name.trim() !== "" && group !== "" && !saving;

  const submit = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), material_term_group_id: Number(group) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar término" : "Nuevo término"}</DialogTitle>
          <DialogDescription>
            Un término posible del atributo: Negro y Blanco son términos de Color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Atributo *</Label>
            <Select value={group} onValueChange={setGroup} disabled={!!editing}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar atributo..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-term-name">Término *</Label>
            <Input
              id="material-term-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ej: Negro"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={!canSave}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Guardar" : "Crear término"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialTermDialog;
