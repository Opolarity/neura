import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/shared/utils/currency";
import type { QuickOrderLine } from "../../types/quickOrder.types";

interface Props {
  lines: QuickOrderLine[];
  onQuantityChange: (variationId: number, quantity: number) => void;
}

export const OrderCart = ({ lines, onQuantityChange }: Props) => {
  if (lines.length === 0) {
    return <p className="text-xs text-muted-foreground">Agrega prendas desde el buscador.</p>;
  }

  return (
    <ul className="flex flex-col">
      {lines.map((l) => (
        <li key={l.variationId} className="flex items-center gap-2 border-b py-1.5 last:border-b-0">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs">{l.productTitle}</p>
            <p className="text-[11px] text-muted-foreground">
              {[...l.terms, formatCurrency(l.price)].join(" · ")}
              {l.price < l.originalPrice && (
                <span className="ml-1 line-through">{formatCurrency(l.originalPrice)}</span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => onQuantityChange(l.variationId, l.quantity - 1)}
            aria-label={l.quantity === 1 ? `Quitar ${l.productTitle}` : "Una menos"}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-5 text-center text-xs tabular-nums">{l.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => onQuantityChange(l.variationId, l.quantity + 1)}
            disabled={l.quantity >= l.maxStock}
            title={l.quantity >= l.maxStock ? "No hay más stock" : undefined}
            aria-label="Una más"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </li>
      ))}
    </ul>
  );
};
