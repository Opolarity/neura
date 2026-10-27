import { useEffect, useState } from "react";
import { Gift, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { lineKey, lineTotal } from "../../hooks/useQuickOrder";
import type { QuickOrderLine } from "../../types/quickOrder.types";

interface Props {
  lines: QuickOrderLine[];
  /** Nombre del tipo de inventario, solo si el negocio maneja más de uno. */
  stockTypeName: (id: number) => string | null;
  onQuantityChange: (key: string, quantity: number) => void;
  /** `price` null vuelve al precio de lista (y a las reglas de precio). */
  onPriceChange: (key: string, price: number | null, discountAmount: number) => void;
}

/**
 * Editor del precio de una línea: precio unitario y descuento por unidad,
 * como las columnas de la tabla de Añadir venta, pero detrás del precio para
 * no ocupar el ancho del panel.
 */
const PriceEditor = ({
  line,
  onApply,
}: {
  line: QuickOrderLine;
  onApply: (price: number | null, discountAmount: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");

  useEffect(() => {
    if (!open) return;
    setPrice(String(line.price));
    setDiscount(line.discountAmount ? String(line.discountAmount) : "");
  }, [open, line.price, line.discountAmount]);

  const priceValue = price === "" ? NaN : Number(price);
  const discountValue = discount === "" ? 0 : Number(discount);
  const valid =
    Number.isFinite(priceValue) && priceValue >= 0 && Number.isFinite(discountValue) && discountValue >= 0 && discountValue <= priceValue;

  const changed = line.manualPrice || line.discountAmount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded px-0.5 tabular-nums underline decoration-dotted underline-offset-2 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            changed && "font-medium text-foreground"
          )}
          title="Cambiar precio o descuento"
        >
          {formatCurrency(line.price - line.discountAmount)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onApply(priceValue, discountValue);
            setOpen(false);
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="qo-line-price" className="text-xs">
              Precio unitario
            </Label>
            <Input
              id="qo-line-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="qo-line-discount" className="text-xs">
              Descuento por unidad
            </Label>
            <Input
              id="qo-line-discount"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs"
            />
          </div>
          {!valid && price !== "" && (
            <p className="text-[11px] text-destructive">El descuento no puede ser mayor al precio.</p>
          )}
          <p className="text-[11px] text-muted-foreground">Precio de lista: {formatCurrency(line.originalPrice)}</p>
          <div className="flex gap-1.5">
            {changed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 flex-1 text-xs"
                onClick={() => {
                  onApply(null, 0);
                  setOpen(false);
                }}
              >
                Restablecer
              </Button>
            )}
            <Button type="submit" size="sm" className="h-8 flex-1 text-xs" disabled={!valid}>
              Aplicar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

/** Cantidad que se puede escribir además de usar − y +, con tope en el stock. */
const QuantityInput = ({
  line,
  onChange,
}: {
  line: QuickOrderLine;
  onChange: (quantity: number) => void;
}) => {
  const [value, setValue] = useState(String(line.quantity));
  useEffect(() => setValue(String(line.quantity)), [line.quantity]);

  const commit = () => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n === line.quantity) {
      setValue(String(line.quantity));
      return;
    }
    onChange(Math.max(0, n));
  };

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      inputMode="numeric"
      aria-label={`Cantidad de ${line.productTitle}`}
      className="h-6 w-8 rounded border bg-background text-center text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
};

export const OrderCart = ({ lines, stockTypeName, onQuantityChange, onPriceChange }: Props) => {
  if (lines.length === 0) {
    return <p className="text-xs text-muted-foreground">Agrega productos desde el buscador.</p>;
  }

  return (
    <ul className="flex flex-col">
      {lines.map((l) => {
        const key = lineKey(l);
        const stockName = l.isGift ? null : stockTypeName(l.stockTypeId);
        return (
          <li key={key} className="flex items-center gap-2 border-b py-1.5 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-xs">
                {l.isGift && <Gift className="h-3 w-3 shrink-0 text-primary" />}
                <span className="truncate">{l.productTitle}</span>
              </p>
              <p className="flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
                {[...l.terms, stockName].filter(Boolean).join(" · ")}
                {(l.terms.length > 0 || stockName) && <span aria-hidden="true">·</span>}
                {l.isGift ? (
                  <span className="font-medium text-primary">Regalo</span>
                ) : (
                  <>
                    <PriceEditor line={l} onApply={(price, discount) => onPriceChange(key, price, discount)} />
                    {l.price - l.discountAmount < l.originalPrice && (
                      <span className="line-through">{formatCurrency(l.originalPrice)}</span>
                    )}
                  </>
                )}
              </p>
            </div>
            {l.isGift ? (
              <span className="text-xs tabular-nums text-muted-foreground">× {l.quantity}</span>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onQuantityChange(key, l.quantity - 1)}
                  aria-label={l.quantity === 1 ? `Quitar ${l.productTitle}` : "Una menos"}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <QuantityInput line={l} onChange={(q) => onQuantityChange(key, q)} />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onQuantityChange(key, l.quantity + 1)}
                  disabled={l.quantity >= l.maxStock}
                  title={l.quantity >= l.maxStock ? "No hay más stock" : undefined}
                  aria-label="Una más"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
            <span className="w-16 shrink-0 text-right text-xs tabular-nums">
              {l.isGift ? formatCurrency(0) : formatCurrency(lineTotal(l))}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
