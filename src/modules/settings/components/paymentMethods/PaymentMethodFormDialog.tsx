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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethod, PaymentMethodPayload } from "../../types/PaymentMethods.types";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { BusinessAccountsApi } from "../../services/PaymentMethods.services";

interface PaymentMethodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PaymentMethod | null;
  saving: boolean;
  onSaved: (payload: PaymentMethodPayload) => Promise<void>;
}

export const PaymentMethodFormDialog = ({
  open,
  item,
  saving,
  onSaved,
  onOpenChange,
}: PaymentMethodFormDialogProps) => {
  const [businessAccounts, setBusinessAccounts] = useState<{ id: number; name: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const { register, handleSubmit, control, reset } = useForm<PaymentMethodPayload>({
    defaultValues: item
      ? {
          name: item.name,
          business_account_id: item.business_account_id,
          active: item.active,
        }
      : {
          name: "",
          business_account_id: null,
          active: true,
        },
  });

  useEffect(() => {
    if (!open) return;
    setOptionsLoading(true);
    BusinessAccountsApi()
      .then(setBusinessAccounts)
      .catch(console.error)
      .finally(() => setOptionsLoading(false));
  }, [open]);

  const onSubmit = async (data: PaymentMethodPayload) => {
    const payload: PaymentMethodPayload = {
      name: data.name,
      business_account_id: data.business_account_id,
      active: data.active,
    };
    if (item?.id) {
      payload.id = item.id;
    }
    await onSaved(payload);
    reset({ name: "", business_account_id: null, active: true });
  };

  const isEditing = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Crear"} Método de Pago
          </DialogTitle>
        </DialogHeader>

        <form
          id="payment-method-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="pm-name">Nombre</Label>
            <Input
              id="pm-name"
              placeholder="Ej: Tarjeta de Crédito"
              {...register("name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Cuenta de Negocio</Label>
            <Controller
              name="business_account_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ""}
                  onValueChange={(val) => field.onChange(Number(val))}
                  disabled={optionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        optionsLoading
                          ? "Cargando..."
                          : "Seleccionar cuenta de negocio"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {businessAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pm-active">Estado</Label>
            <Controller
              name="active"
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
          <Button
            type="submit"
            form="payment-method-form"
            disabled={saving || optionsLoading}
          >
            {isEditing ? "Actualizar" : saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
