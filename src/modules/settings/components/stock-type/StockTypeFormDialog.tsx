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
import { StockType, StockTypePayload } from "../../types/StockType.types";
import { useForm } from "react-hook-form";

interface StockTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockType | null;
  saving: boolean;
  onSaved: (payload: StockTypePayload) => Promise<void>;
}

export const StockTypeFormDialog = ({
  open,
  item,
  saving,
  onSaved,
  onOpenChange,
}: StockTypeFormDialogProps) => {
  const { register, handleSubmit, reset } = useForm<StockTypePayload>({
    defaultValues: item
      ? { name: item.name, code: "" }
      : { name: "", code: "" },
  });

  const onSubmit = async (data: StockTypePayload) => {
    const payload: StockTypePayload = {
      name: data.name,
      code: data.code,
    };
    if (item?.id) {
      payload.id = item.id;
    }
    await onSaved(payload);
    reset({ name: "", code: "" });
  };

  const isEditing = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Crear"} Tipo de Stock
          </DialogTitle>
        </DialogHeader>

        <form
          id="stock-type-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="st-name">Nombre</Label>
            <Input
              id="st-name"
              placeholder="Ej: Materia Prima"
              {...register("name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="st-code">Código</Label>
            <Input
              id="st-code"
              placeholder="Ej: MP"
              {...register("code", { required: true })}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form="stock-type-form" disabled={saving}>
            {isEditing ? "Actualizar" : saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
