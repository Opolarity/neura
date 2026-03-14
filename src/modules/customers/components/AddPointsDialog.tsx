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
import { ChevronsUpDown, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AccountOption = {
  id: number;
  name: string | null;
  last_name: string | null;
  document_number: string | null;
};

const buildLabel = (a: AccountOption) => {
  const parts = [a.name?.trim(), a.last_name?.trim()].filter(Boolean).join(" ");
  return parts
    ? `${parts}${a.document_number ? ` (${a.document_number})` : ""}`
    : (a.document_number ?? `Cuenta #${a.id}`);
};

interface AddPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddPointsDialog = ({ open, onOpenChange, onSuccess }: AddPointsDialogProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [searchResults, setSearchResults] = useState<AccountOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedAccount(null);
      setAccountSearch("");
      setSearchResults([]);
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

  const handleSubmit = async () => {
    if (!selectedAccount) { toast.error("Selecciona un cliente"); return; }
    const qty = Number(points);
    if (!qty || isNaN(qty)) { toast.error("Ingresa una cantidad válida de puntos"); return; }

    setSaving(true);
    try {
      // 1. Insert movement
      const { error: movErr } = await (supabase as any)
        .from("customer_points_movements")
        .insert({ account_id: selectedAccount.id, quantity: qty, note: note.trim() || null });
      if (movErr) throw movErr;

      // 2. Upsert customer_profile points (increment)
      const { data: profile, error: profileReadErr } = await (supabase as any)
        .from("customer_profile")
        .select("id, points")
        .eq("id", selectedAccount.id)
        .maybeSingle();
      if (profileReadErr) throw profileReadErr;

      const currentPoints = profile?.points ?? 0;
      const newPoints = currentPoints + qty;

      if (profile) {
        const { error: updateErr } = await (supabase as any)
          .from("customer_profile")
          .update({ points: newPoints })
          .eq("id", selectedAccount.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await (supabase as any)
          .from("customer_profile")
          .insert({ id: selectedAccount.id, points: newPoints, orders_quantity: 0 });
        if (insertErr) throw insertErr;
      }

      toast.success(`${qty > 0 ? "+" : ""}${qty} puntos aplicados a ${buildLabel(selectedAccount)}`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Error al guardar puntos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sumar Puntos</DialogTitle>
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

          {/* Points */}
          <div className="space-y-1.5">
            <Label htmlFor="points">Puntos a sumar *</Label>
            <Input
              id="points"
              type="number"
              placeholder="Ej: 50"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Nota / Motivo</Label>
            <Textarea
              id="note"
              placeholder="Ej: Compra en tienda física, promoción especial..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
