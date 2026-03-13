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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check, Search } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import {
  BusinessAccount,
  BusinessAccountPayload,
} from "../../types/BusinessAccount.types";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { typesByModuleCode } from "@/shared/services/service";
import { supabase } from "@/integrations/supabase/client";

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
  const [accounts, setAccounts] = useState<{ id: number; name: string; last_name: string | null; document_number: string | null }[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  const { register, handleSubmit, control, reset } =
    useForm<BusinessAccountPayload>({
      defaultValues: item
        ? {
            name: item.name,
            bank: item.bank,
            account_number: item.account_number,
            total_amount: item.total_amount,
            business_account_type_id: item.business_account_type_id,
            account_id: item.account_id,
          }
        : {
            name: "",
            bank: "",
            account_number: undefined,
            total_amount: undefined,
            business_account_type_id: undefined,
            account_id: undefined,
          },
    });

  useEffect(() => {
    if (!open) return;
    setTypesLoading(true);
    typesByModuleCode("BNA")
      .then(setAccountTypes)
      .catch(console.error)
      .finally(() => setTypesLoading(false));

    setAccountsLoading(true);
    supabase
      .from("accounts")
      .select("id, name, last_name, document_number")
      .eq("is_active", true)
      .eq("show", true)
      .order("name")
      .then(({ data }) => {
        setAccounts(data ?? []);
        setAccountsLoading(false);
      });
  }, [open]);

  const onSubmit = async (data: BusinessAccountPayload) => {
    const payload: BusinessAccountPayload = {
      name: data.name,
      bank: data.bank,
      account_number: data.account_number,
      total_amount: data.total_amount,
      business_account_type_id: data.business_account_type_id,
      account_id: data.account_id,
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
      account_id: undefined,
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

          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Controller
              name="account_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                const buildLabel = (a: typeof accounts[0]) => {
                  const parts = [a.name?.trim(), a.last_name?.trim()].filter(s => !!s);
                  return parts.length > 0
                    ? parts.join(" ") + (a.document_number ? ` (${a.document_number})` : "")
                    : (a.document_number ?? `Cuenta #${a.id}`);
                };
                const selected = accounts.find((a) => a.id === field.value);
                const selectedLabel = selected ? buildLabel(selected) : null;
                return (
                  <Popover open={accountPopoverOpen} onOpenChange={(o) => { setAccountPopoverOpen(o); if (!o) setAccountSearch(""); }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={accountsLoading}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {accountsLoading
                            ? "Cargando..."
                            : selectedLabel ?? "Buscar cuenta..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} align="start">
                      {/* Search input */}
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Buscar por nombre o documento..."
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      {/* Results list */}
                      <div className="max-h-60 overflow-auto p-1">
                        {(() => {
                          const filtered = accounts.filter((a) => {
                            if (!accountSearch) return true;
                            const haystack = [a.name?.trim(), a.last_name?.trim(), a.document_number]
                              .filter(s => !!s)
                              .join(" ")
                              .toLowerCase();
                            return haystack.includes(accountSearch.toLowerCase());
                          });
                          if (filtered.length === 0) {
                            return <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron cuentas.</p>;
                          }
                          return filtered.map((account) => {
                            const label = buildLabel(account);
                            const isSelected = field.value === account.id;
                            return (
                              <div
                                key={account.id}
                                className={cn(
                                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                  isSelected && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                  field.onChange(account.id);
                                  setAccountPopoverOpen(false);
                                  setAccountSearch("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                                {label}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }}
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
