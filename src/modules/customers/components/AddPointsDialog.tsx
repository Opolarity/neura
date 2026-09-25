import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check, Equal, Loader2, Minus, Plus, Search } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/shared/hooks/use-toast";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { toastError } from "@/shared/utils/toastError";
import { useCustomerLevels } from "../hooks/useCustomerLevels";
import type { CustomerLevel } from "../types/customerLevels.types";

type AccountOption = {
  id: number;
  name: string | null;
  last_name: string | null;
  document_number: string | null;
};

// add / subtract: se escribe cuánto sumar o restar. set: se escribe el saldo
// final y el backend calcula la diferencia con el saldo real.
type AdjustType = "add" | "subtract" | "set";

const buildLabel = (a: AccountOption) => {
  const parts = [a.name?.trim(), a.last_name?.trim()].filter(Boolean).join(" ");
  return parts
    ? `${parts}${a.document_number ? ` (${a.document_number})` : ""}`
    : (a.document_number ?? `Cuenta #${a.id}`);
};

const formatPoints = (n: number) =>
  n.toLocaleString("es-PE", { maximumFractionDigits: 2 });

// Nivel activo que contiene esos puntos (rango [min, max), igual que en la BD).
const levelFor = (levels: CustomerLevel[], points: number): CustomerLevel | null =>
  levels.find(
    (l) => l.active && points >= l.minPoints && (l.maxPoints === null || points < l.maxPoints),
  ) ?? null;

interface AddPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Ajuste manual de puntos: sumar, restar o fijar el saldo. La cantidad se
// escribe siempre en positivo; el signo lo pone el tipo de ajuste. El backend
// (add-customer-points -> sp_adjust_customer_points) no deja el saldo en negativo.
export const AddPointsDialog = ({ open, onOpenChange, onSuccess }: AddPointsDialogProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AccountOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [adjustType, setAdjustType] = useState<AdjustType>("add");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { levels } = useCustomerLevels();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedAccount(null);
      setBalance(null);
      setAccountSearch("");
      setSearchResults([]);
      setAdjustType("add");
      setPoints("");
      setNote("");
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = accountSearch.trim();
    if (!term) { setSearchResults([]); return; }
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

  // Saldo actual del cliente elegido
  useEffect(() => {
    if (!selectedAccount) { setBalance(null); return; }
    let cancelled = false;
    setBalanceLoading(true);
    supabase
      .from("customer_profile")
      .select("points")
      .eq("id", selectedAccount.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setBalance(Number(data?.points ?? 0));
        setBalanceLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedAccount]);

  const isSet = adjustType === "set";
  const amount = Number(points);
  // Fijar saldo admite 0 (dejar al cliente sin puntos); sumar/restar no.
  const validAmount =
    points.trim() !== "" && Number.isFinite(amount) && (isSet ? amount >= 0 : amount > 0);
  const signed = adjustType === "add" ? amount : -amount;
  const newBalance =
    balance !== null && validAmount ? (isSet ? amount : balance + signed) : null;
  const change = newBalance !== null && balance !== null ? newBalance - balance : 0;
  const exceedsBalance = newBalance !== null && newBalance < 0;
  const noChange = isSet && newBalance !== null && change === 0;

  const currentLevel = balance !== null ? levelFor(levels, balance) : null;
  const newLevel = newBalance !== null && !exceedsBalance ? levelFor(levels, newBalance) : null;
  const levelChanges = currentLevel && newLevel && currentLevel.id !== newLevel.id;

  const canSave =
    !!selectedAccount && balance !== null && validAmount && !exceedsBalance && !noChange && !saving;

  const handleSubmit = async () => {
    if (!selectedAccount) { toast({ title: "Selecciona un cliente", variant: "destructive" }); return; }
    if (!validAmount) {
      toast({
        title: isSet ? "Ingresa un saldo final de 0 o más" : "Ingresa una cantidad de puntos mayor que 0",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // En "fijar" se manda el saldo deseado, no la diferencia: la calcula el
      // backend con el saldo real, por si cambió mientras el diálogo estaba abierto.
      const payload = isSet
        ? { account_id: selectedAccount.id, target: amount, note: note.trim() || null }
        : { account_id: selectedAccount.id, quantity: signed, note: note.trim() || null };
      await invokeFunction("add-customer-points", { body: payload });

      toast({
        title: isSet
          ? `Saldo de ${buildLabel(selectedAccount)} fijado en ${formatPoints(amount)} puntos`
          : `${adjustType === "add" ? "+" : "−"}${formatPoints(amount)} puntos para ${buildLabel(selectedAccount)}`,
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toastError(err, "No se pudo ajustar los puntos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar puntos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer search */}
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className={cn("truncate", !selectedAccount && "text-muted-foreground")}>
                    {selectedAccount ? buildLabel(selectedAccount) : "Buscar cliente..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="flex items-center border-b px-3 py-2 gap-2">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Buscar por nombre o DNI..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                  />
                  {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {searchResults.length === 0 && !searchLoading && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      {accountSearch.trim() ? "Sin resultados" : "Escribe para buscar"}
                    </p>
                  )}
                  {searchResults.map((acc) => (
                    <button
                      key={acc.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                      onClick={() => {
                        setSelectedAccount(acc);
                        setPopoverOpen(false);
                        setAccountSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "w-4 h-4 shrink-0",
                          selectedAccount?.id === acc.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {buildLabel(acc)}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Saldo actual */}
          {selectedAccount && (
            <div className="rounded-md border p-3 text-sm">
              {balanceLoading || balance === null ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando saldo...
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saldo actual</span>
                  <span className="font-medium">
                    {formatPoints(balance)} pts
                    {currentLevel && (
                      <span className="text-muted-foreground font-normal"> · {currentLevel.name}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tipo de ajuste */}
          <div className="space-y-1.5">
            <Label>Tipo de ajuste *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={adjustType === "add" ? "default" : "outline"}
                onClick={() => setAdjustType("add")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Sumar
              </Button>
              <Button
                type="button"
                variant={adjustType === "subtract" ? "default" : "outline"}
                onClick={() => setAdjustType("subtract")}
              >
                <Minus className="w-4 h-4 mr-2" />
                Restar
              </Button>
              <Button
                type="button"
                variant={adjustType === "set" ? "default" : "outline"}
                onClick={() => setAdjustType("set")}
              >
                <Equal className="w-4 h-4 mr-2" />
                Fijar
              </Button>
            </div>
          </div>

          {/* Points */}
          <div className="space-y-1.5">
            <Label htmlFor="points">
              {adjustType === "add" ? "Puntos a sumar *" : adjustType === "subtract" ? "Puntos a restar *" : "Puntos a fijar *"}
            </Label>
            <Input
              id="points"
              type="number"
              min="0"
              step="any"
              placeholder={isSet ? "Ej: 1200" : "Ej: 50"}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
            {exceedsBalance && balance !== null && (
              <p className="text-xs text-destructive">
                El cliente solo tiene {formatPoints(balance)} puntos.
              </p>
            )}
            {noChange && balance !== null && (
              <p className="text-xs text-destructive">
                El cliente ya tiene {formatPoints(balance)} puntos.
              </p>
            )}
            {newBalance !== null && !exceedsBalance && !noChange && (
              <p className="text-xs text-muted-foreground">
                {isSet ? (
                  <>
                    Cambio:{" "}
                    <span className="font-medium text-foreground">
                      {change > 0 ? "+" : "−"}{formatPoints(Math.abs(change))} pts
                    </span>
                  </>
                ) : (
                  <>
                    Nuevo saldo:{" "}
                    <span className="font-medium text-foreground">{formatPoints(newBalance)} pts</span>
                  </>
                )}
                {newLevel && ` · ${newLevel.name}`}
                {levelChanges && ` (${change > 0 ? "sube" : "baja"} de ${currentLevel!.name})`}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Nota / Motivo</Label>
            <Textarea
              id="note"
              placeholder={
                adjustType === "add"
                  ? "Ej: Compra en tienda física, promoción especial..."
                  : adjustType === "subtract"
                    ? "Ej: Corrección de puntos mal asignados, devolución..."
                    : "Ej: Corrección tras revisión de compras..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            {isSet && (
              <p className="text-xs text-muted-foreground">
                Si la dejas vacía se anota «Saldo fijado en N (antes M)».
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!validAmount
              ? "Guardar"
              : isSet
                ? `Fijar saldo en ${formatPoints(amount)}`
                : `${adjustType === "add" ? "Sumar" : "Restar"} ${formatPoints(amount)} puntos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
