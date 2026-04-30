import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { MovementClass, MovementClassPayload } from "../../types/MovementClasses.types";

interface MovementClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MovementClass | null;
  saving: boolean;
  onSaved: (payload: MovementClassPayload) => Promise<void>;
}

export const MovementClassFormDialog = ({
  open,
  item,
  saving,
  onSaved,
  onOpenChange,
}: MovementClassFormDialogProps) => {
  const { register, handleSubmit, reset } = useForm<MovementClassPayload>({
    defaultValues: item
      ? { name: item.name, code: item.code }
      : { name: "", code: "" },
  });

  const onSubmit = async (data: MovementClassPayload) => {
    const payload: MovementClassPayload = { name: data.name, code: data.code };
    if (item?.id) payload.id = item.id;
    await onSaved(payload);
    reset({ name: "", code: "" });
  };

  const isEditing = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Crear"} Clase de Movimiento
          </DialogTitle>
        </DialogHeader>

        <form
          id="movement-class-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="mc-name">Nombre</Label>
            <Input
              id="mc-name"
              placeholder="Ej: Gastos Operativos"
              {...register("name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mc-code">Código</Label>
            <Input
              id="mc-code"
              placeholder="Ej: GAST-OP"
              {...register("code", { required: true })}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="movement-class-form" disabled={saving}>
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
