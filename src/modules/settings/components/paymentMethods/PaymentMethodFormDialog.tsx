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
import { ScrollArea } from "@/components/ui/scroll-area";
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import { Upload, X } from "lucide-react";
import { PaymentMethod, PaymentMethodPayload } from "../../types/PaymentMethods.types";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { BusinessAccountsApi } from "../../services/PaymentMethods.services";

interface PaymentMethodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PaymentMethod | null;
  saving: boolean;
  onSaved: (payload: PaymentMethodPayload) => Promise<void>;
}

// Tiptap deja "<p></p>" cuando se borra todo el texto: eso es "sin descripción".
const normalizeDescription = (html: string | undefined) =>
  html && html.replace(/<[^>]+>/g, "").trim() !== "" ? html : "";

export const PaymentMethodFormDialog = ({
  open,
  item,
  saving,
  onSaved,
  onOpenChange,
}: PaymentMethodFormDialogProps) => {
  const [businessAccounts, setBusinessAccounts] = useState<{ id: number; name: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // En edición la cuenta de negocio queda fija (y no se manda en el payload).
  // `is_active` es el borrado virtual y no se toca desde aquí.
  const isEditing = !!item;

  const { register, handleSubmit, control, reset, setValue, watch } = useForm<PaymentMethodPayload>({
    defaultValues: item
      ? {
          name: item.name,
          active: item.active,
          description: item.description ?? "",
          image_url: item.image_url ?? "",
          requires_voucher: item.requires_voucher ?? false,
          image: null,
        }
      : {
          name: "",
          business_account_id: null,
          active: true,
          description: "",
          image_url: "",
          requires_voucher: false,
          image: null,
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue("image", file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    // Permite volver a elegir el mismo archivo después de quitarlo.
    e.target.value = "";
  };

  const removeImage = () => {
    setValue("image", null);
    setValue("image_url", "");
    setImagePreview(null);
  };

  const onSubmit = async (data: PaymentMethodPayload) => {
    const extra = {
      description: normalizeDescription(data.description),
      image_url: data.image_url ?? "",
      requires_voucher: data.requires_voucher ?? false,
      image: data.image ?? null,
    };
    const payload: PaymentMethodPayload = isEditing
      ? { id: item.id, name: data.name, active: data.active, ...extra }
      : { name: data.name, business_account_id: data.business_account_id, active: data.active, ...extra };
    await onSaved(payload);
    reset();
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Crear"} Método de Pago
          </DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, igual que ProductsFilterModal: con
            la descripción y la imagen el formulario no cabe en pantallas bajas
            y dejaba el footer fuera de alcance. El max-h va en un contenedor
            propio, no en el ScrollArea, y el pr-4 aparta los campos de la
            barra de scroll. El botón Guardar queda fuera del scroll y envía el
            form por su id. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <form
              id="payment-method-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 py-4 pl-1 pr-4"
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

              <WysiwygEditor
                label="Descripción"
                value={watch("description") || ""}
                onChange={(value) => setValue("description", value)}
                placeholder="Ej: número de cuenta, titular o instrucciones de pago"
                height="150px"
                toolbar="basic"
                disabled={saving}
              />

              <div className="space-y-2">
                <Label>Imagen</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={saving}
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-44 object-contain rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar imagen
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="pm-requires-voucher">Requiere comprobante de pago</Label>
                  <p className="text-sm text-muted-foreground">
                    El cliente debe adjuntar el comprobante al pagar.
                  </p>
                </div>
                <Controller
                  name="requires_voucher"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="pm-requires-voucher"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
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
                      id="pm-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </form>
          </ScrollArea>
        </div>

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
