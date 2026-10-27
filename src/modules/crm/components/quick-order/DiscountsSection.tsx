import { useState } from "react";
import { Minus, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import type { QuickOrderManualDiscount } from "../../types/quickOrder.types";

interface Props {
  ruleDiscounts: { name: string; amount: number }[];
  manualDiscounts: QuickOrderManualDiscount[];
  onAdd: (name: string, amount: number) => void;
  onRemove: (id: string) => void;
}

/**
 * Descuentos del pedido. Los de las reglas de precio se ven pero no se tocan;
 * los manuales se agregan con nombre y monto, como descuento (resta) o
 * recargo (suma), igual que en el Punto de venta.
 */
export const DiscountsSection = ({ ruleDiscounts, manualDiscounts, onAdd, onRemove }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [sign, setSign] = useState<"negative" | "positive">("negative");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const value = parseFloat(amount);
    if (!name.trim() || isNaN(value) || value <= 0) {
      setError("Escribe un nombre y un monto mayor a cero.");
      return;
    }
    onAdd(name.trim(), sign === "negative" ? -Math.abs(value) : Math.abs(value));
    setName("");
    setAmount("");
    setSign("negative");
    setError(null);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {ruleDiscounts.map((d) => (
        <div key={`rule-${d.name}`} className="flex items-center justify-between text-xs">
          <span className="truncate text-muted-foreground" title="Regla de precio">
            {d.name}
          </span>
          <span className="tabular-nums">{formatCurrency(d.amount)}</span>
        </div>
      ))}
      {manualDiscounts.map((d) => (
        <div key={d.id} className="flex items-center gap-1 text-xs">
          <span className="min-w-0 flex-1 truncate">{d.name}</span>
          <span className="tabular-nums">{formatCurrency(d.amount)}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(d.id)} aria-label={`Quitar ${d.name}`}>
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {open ? (
        <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-2">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Motivo (p. ej. Cliente frecuente)"
            className="h-8 text-xs"
            aria-label="Motivo del descuento"
          />
          <div className="flex gap-1.5">
            <div className="flex overflow-hidden rounded-md border" role="radiogroup" aria-label="Tipo">
              {(["negative", "positive"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={sign === s}
                  onClick={() => setSign(s)}
                  className={cn(
                    "flex items-center gap-1 px-2 text-[11px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    sign === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {s === "negative" ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {s === "negative" ? "Descuento" : "Recargo"}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="Monto"
              className="h-8 flex-1 text-xs"
              aria-label="Monto del descuento"
            />
          </div>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <div className="flex justify-end gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={add}>
              Agregar
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Agregar descuento
        </Button>
      )}
    </div>
  );
};
