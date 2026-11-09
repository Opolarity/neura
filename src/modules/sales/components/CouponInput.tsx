import { useState } from "react";
import { Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CouponInputProps {
  /** Código ya aplicado (el que viaja al motor de reglas). null = sin cupón. */
  appliedCode: string | null;
  /** Motivo por el que se rechazó o retiró el último cupón. */
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  /** Al editar el código se descarta el motivo del rechazo anterior. */
  onClearError: () => void;
}

/**
 * T-340: campo de cupón de la venta (crear venta y POS). Solo captura el código:
 * lo valida process-price-rules, que devuelve la regla del cupón como cualquier
 * otra regla aplicada o el motivo del rechazo. Un cupón rechazado no queda
 * aplicado: el campo conserva el código escrito y muestra el motivo debajo hasta
 * que se edite o se aplique otro.
 */
export function CouponInput({ appliedCode, error, onApply, onRemove, onClearError }: CouponInputProps) {
  const [code, setCode] = useState("");

  if (appliedCode) {
    return (
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
          onClick={() => {
            setCode("");
            onRemove();
          }}
          aria-label="Quitar cupón"
        >
          <X className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    );
  }

  const apply = () => {
    if (!code.trim()) return;
    onApply(code);
  };

  return (
    <div className="space-y-0.5">
      <div className="flex gap-1">
        <Input
          placeholder="Código de cupón"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) onClearError();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          aria-invalid={!!error}
          className="h-7 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2"
          onClick={apply}
          disabled={!code.trim()}
        >
          Aplicar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
