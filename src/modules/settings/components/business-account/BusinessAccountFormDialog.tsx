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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BusinessAccount,
  BusinessAccountPayload,
} from "../../types/BusinessAccount.types";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { typesByModuleCode } from "@/shared/services/service";

interface BusinessAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BusinessAccount | null;
  saving: boolean;
  onSaved: (payload: BusinessAccountPayload) => Promise<void>;
}

export const BusinessAccountFormDialog = ({
  open,
  item,
  saving,
  onSaved,
  onOpenChange,
}: BusinessAccountFormDialogProps) => {
  const [accountTypes, setAccountTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [typesLoading, setTypesLoading] = useState(false);

  const { register, handleSubmit, control, reset } =
    useForm<BusinessAccountPayload>({
      defaultValues: item
        ? {
            name: item.name,
            bank: item.bank,
            account_number: item.account_number,
            total_amount: item.total_amount,
            business_account_type_id: item.business_account_type_id,
          }
        : {
            name: "",
            bank: "",
            account_number: undefined,
            total_amount: undefined,
            business_account_type_id: undefined,
          },
    });

  useEffect(() => {
    if (!open) return;
    setTypesLoading(true);
    typesByModuleCode("BNA")
      .then(setAccountTypes)
      .catch(console.error)
      .finally(() => setTypesLoading(false));
  }, [open]);

  const onSubmit = async (data: BusinessAccountPayload) => {
    const payload: BusinessAccountPayload = {
      name: data.name,
      bank: data.bank,
      account_number: data.account_number,
      total_amount: data.total_amount,
      business_account_type_id: data.business_account_type_id,
    };
    if (item?.id) {
      payload.id = item.id;
    }
    await onSaved(payload);
    reset({
      name: "",
      bank: "",
      account_number: undefined,
      total_amount: undefined,
      business_account_type_id: undefined,
    });
  };

  const isEditing = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Crear"} Cuenta de Negocio
          </DialogTitle>
        </DialogHeader>

        <form
          id="business-account-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="ba-name">Nombre</Label>
            <Input
              id="ba-name"
              placeholder="Ej: Cuenta Principal"
              {...register("name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ba-bank">Banco</Label>
            <Input
              id="ba-bank"
              placeholder="Ej: Bancolombia"
              {...register("bank", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ba-account-number">Número de Cuenta</Label>
            <Input
              id="ba-account-number"
              type="number"
              placeholder="Ej: 1234567890"
              {...register("account_number", {
                required: true,
                valueAsNumber: true,
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ba-total-amount">Monto Total</Label>
            <Input
              id="ba-total-amount"
              type="number"
              step="0.01"
              placeholder="Ej: 10000.00"
              {...register("total_amount", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Cuenta</Label>
            <Controller
              name="business_account_type_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ""}
                  onValueChange={(val) => field.onChange(Number(val))}
                  disabled={typesLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        typesLoading ? "Cargando..." : "Seleccionar tipo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <Button
            type="submit"
            form="business-account-form"
            disabled={saving || typesLoading}
          >
            {isEditing ? "Actualizar" : saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
