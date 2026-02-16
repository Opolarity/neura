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
import { Switch } from "@/components/ui/switch";
import { PriceList, PriceListPayload } from "../../types/PriceList.types";
import { useForm, Controller } from "react-hook-form";

interface PriceListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PriceList | null;
  saving: boolean;
  onSaved: (newPriceList: PriceListPayload) => Promise<void>;
}

export const PriceListFormDialog = ({
  open,
  item,
  saving,
  onSaved,
  onOpenChange,
}: PriceListFormDialogProps) => {
  const { register, handleSubmit, control, reset } = useForm<PriceListPayload>({
    defaultValues: item
      ? {
          name: item.name,
          code: item.code,
          location: item.location.toString(),
          web: item.isWeb,
        }
      : {
          name: "",
          code: "",
          location: "",
          web: false,
        },
  });

  const onSubmit = async (newPriceList: PriceListPayload) => {
    console.log(newPriceList);
    let payload: PriceListPayload = {
      name: newPriceList.name,
      code: newPriceList.code,
      location: newPriceList.location,
      web: newPriceList.web,
    };
    if (item?.id) {
      payload.id = item.id;
    }
    await onSaved(payload);

    reset({
      name: "",
      code: "",
      location: "",
      web: false,
    });
  };

  const isEditing = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Crear"} Lista de Precios
          </DialogTitle>
        </DialogHeader>

        <form
          id="price-list-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="pl-name">Nombre</Label>
            <Input id="pl-name" {...register("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pl-code">Código</Label>
            <Input id="pl-code" {...register("code")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pl-location">Ubicación</Label>
            <Input id="pl-location" type="number" {...register("location")} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pl-web">Web</Label>
            <Controller
              name="web"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
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
          <Button type="submit" form="price-list-form" disabled={saving}>
            {isEditing ? "Editar" : saving ? "Guardando" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
