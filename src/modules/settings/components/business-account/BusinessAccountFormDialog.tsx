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
import { ChevronsUpDown, Check, Search, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import {
  BusinessAccount,
  BusinessAccountPayload,
} from "../../types/BusinessAccount.types";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { typesByModuleCode } from "@/shared/services/service";
import { supabase } from "@/integrations/supabase/client";

type AccountOption = { id: number; name: string | null; last_name: string | null; document_number: string | null };

const buildAccountLabel = (a: AccountOption) => {
  const parts = [a.name?.trim(), a.last_name?.trim()].filter(Boolean);
  return parts.length > 0
    ? parts.join(" ") + (a.document_number ? ` (${a.document_number})` : "")
    : (a.document_number ?? `Cuenta #${a.id}`);
};

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
  const [accountTypes, setAccountTypes] = useState<{ id: number; name: string }[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AccountOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load account types on open
  useEffect(() => {
    if (!open) return;
    setTypesLoading(true);
    typesByModuleCode("BNA")
      .then(setAccountTypes)
      .catch(console.error)
      .finally(() => setTypesLoading(false));
  }, [open]);

  // When editing, fetch the currently selected account to show its label
  useEffect(() => {
    if (!open || !item?.account_id) {
      setSelectedAccount(null);
      return;
    }
    supabase
      .from("accounts")
      .select("id, name, last_name, document_number")
      .eq("id", item.account_id)
      .single()
      .then(({ data }) => setSelectedAccount(data ?? null));
  }, [open, item?.account_id]);

  // Debounced server-side search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = accountSearch.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("accounts")
        .select("id, name, last_name, document_number")
        .eq("is_active", true)
        .eq("show", true)
        .or(`name.ilike.%${term}%,last_name.ilike.%${term}%,document_number.ilike.%${term}%`)
        .limit(20);
      setSearchResults(data ?? []);
      setSearchLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [accountSearch]);

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
                const displayLabel = selectedAccount
                  ? buildAccountLabel(selectedAccount)
                  : field.value
                  ? `Cuenta #${field.value}`
                  : null;
                return (
                  <Popover
                    open={accountPopoverOpen}
                    onOpenChange={(o) => {
                      setAccountPopoverOpen(o);
                      if (!o) { setAccountSearch(""); setSearchResults([]); }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">{displayLabel ?? "Buscar cuenta..."}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} align="start">
                      {/* Search input */}
                      <div className="flex items-center border-b px-3">
                        {searchLoading
                          ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                          : <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        }
                        <input
                          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Buscar por nombre, apellido o documento..."
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          autoFocus
                          autoComplete="off"
                        />
                      </div>
                      {/* Results list */}
                      <div className="max-h-60 overflow-auto p-1">
                        {!accountSearch.trim() ? (
                          <p className="py-6 text-center text-sm text-muted-foreground">Escribe para buscar cuentas.</p>
                        ) : searchResults.length === 0 && !searchLoading ? (
                          <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron cuentas.</p>
                        ) : (
                          searchResults.map((account) => {
                            const label = buildAccountLabel(account);
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
                                  setSelectedAccount(account);
                                  setAccountPopoverOpen(false);
                                  setAccountSearch("");
                                  setSearchResults([]);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                                {label}
                              </div>
                            );
                          })
                        )}
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
