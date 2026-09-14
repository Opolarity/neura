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

  // En edición solo se cambian nombre y `active`; la cuenta de negocio queda
  // fija (y no se manda en el payload). `is_active` es el borrado virtual y
  // no se toca desde aquí.
  const isEditing = !!item;

  const { register, handleSubmit, control, reset } = useForm<PaymentMethodPayload>({
    defaultValues: item
      ? {
          name: item.name,
          active: item.active,
        }
      : {
          name: "",
          business_account_id: null,
          active: true,
        },
  });

  useEffect(() => {
    // El selector de cuentas solo existe al crear: en edición no hace falta
    // cargarlo.
    if (!open || isEditing) return;
    setOptionsLoading(true);
    BusinessAccountsApi()
      .then(setBusinessAccounts)
      .catch(console.error)
      .finally(() => setOptionsLoading(false));
  }, [open, isEditing]);

  const onSubmit = async (data: PaymentMethodPayload) => {
    const payload: PaymentMethodPayload = isEditing
      ? { id: item.id, name: data.name, active: data.active }
      : { name: data.name, business_account_id: data.business_account_id, active: data.active };
    await onSaved(payload);
    reset({ name: "", business_account_id: null, active: true });
  };

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
            <Label htmlFor="pm-business-account">Cuenta de Negocio</Label>
            {isEditing ? (
              // El listado ya trae el nombre de la cuenta en
              // `business_account_id` (así lo devuelve sp_get_payments_methods),
              // por eso se muestra tal cual y no se resuelve contra el selector.
              <Input
                id="pm-business-account"
                value={item.business_account_id ?? ""}
                disabled
                readOnly
              />
            ) : (
              <Controller
                name="business_account_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={optionsLoading}
                  >
                    <SelectTrigger id="pm-business-account">
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
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pm-active">Estado</Label>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch
                  id="pm-active"
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
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
