import { useState } from "react";
import { Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CouponInputProps {
  /** Código ya aplicado (el que viaja al motor de reglas). null = sin cupón. */
  appliedCode: string | null;
  /** Motivo por el que el motor rechazó el cupón aplicado. */
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
}

/**
 * T-340: campo de cupón de la venta (crear venta y POS). Solo captura el código:
 * lo valida process-price-rules, que devuelve la regla del cupón como cualquier
 * otra regla aplicada o el motivo del rechazo.
 */
export function CouponInput({ appliedCode, error, onApply, onRemove }: CouponInputProps) {
  const [code, setCode] = useState("");

  if (appliedCode) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Ticket className="w-3 h-3" />
            Cupón <span className="font-medium text-foreground">{appliedCode}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onRemove}
            aria-label="Quitar cupón"
          >
            <X className="w-3 h-3 text-destructive" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  const apply = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onApply(trimmed);
    setCode("");
  };

  return (
    <div className="flex gap-1">
      <Input
        placeholder="Código de cupón"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        className="h-7 text-xs"
      />
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2" onClick={apply}>
        Aplicar
      </Button>
    </div>
  );
}
