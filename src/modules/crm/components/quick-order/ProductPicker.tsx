import { Loader2, Plus, ScanLine, Search, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import type { QuickOrderProduct } from "../../types/quickOrder.types";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  results: QuickOrderProduct[];
  searching: boolean;
  priceListId: number | null;
  onAdd: (product: QuickOrderProduct) => void;
  /** Enter en el buscador: agrega la coincidencia exacta por código, como el lector de barras. */
  onScan: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

const priceOf = (p: QuickOrderProduct, priceListId: number | null) => {
  const entry = priceListId ? p.prices.find((x) => x.priceListId === priceListId) : p.prices[0];
  return entry?.salePrice || entry?.price || 0;
};

/**
 * Buscador de productos, igual que el Punto de venta: una fila por variación
 * (talla/color) con su stock, su precio y un + para agregarla. Tocar + otra
 * vez suma una unidad, hasta el stock disponible. Enter con un código de
 * barras o un SKU agrega la prenda directo.
 */
export const ProductPicker = ({
  query,
  onQueryChange,
  results,
  searching,
  priceListId,
  onAdd,
  onScan,
  hasMore,
  loadingMore,
  onLoadMore,
}: Props) => (
  <div className="flex flex-col gap-2">
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        onScan();
      }}
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar producto, SKU o código"
        className="h-8 pl-8 pr-8 text-xs"
        aria-label="Buscar producto"
      />
      {searching ? (
        <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin" />
      ) : (
        <span title="Enter agrega el código exacto" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          <ScanLine className="h-3.5 w-3.5" />
        </span>
      )}
    </form>

    {!searching && results.length === 0 && (
      <p className="px-1 text-xs text-muted-foreground">
        {query.trim() ? "Ningún producto coincide con la búsqueda." : "Sin productos con stock en tu almacén."}
      </p>
    )}

    {results.length > 0 && (
      <ul className="overflow-hidden rounded-lg border">
        {results.map((v) => {
          const variation = v.terms.map((t) => t.name).join(" / ") || v.sku;
          const outOfStock = v.stock <= 0;
          return (
            <li key={v.variationId} className="flex items-center gap-2 border-b px-2 py-1.5 last:border-b-0 even:bg-muted/50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Shirt className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{v.productTitle}</p>
                <p className="truncate text-[11px] text-muted-foreground">{variation}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium tabular-nums">{formatCurrency(priceOf(v, priceListId))}</p>
                <p
                  className={cn(
                    "text-[11px] tabular-nums",
                    outOfStock ? "text-destructive" : "text-success"
                  )}
                >
                  {outOfStock ? "Sin stock" : `${v.stock} en stock`}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onAdd(v)}
                disabled={outOfStock}
                title={outOfStock ? "Sin stock" : "Agregar al pedido"}
                aria-label={`Agregar ${v.productTitle} ${variation}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </li>
          );
        })}
        {hasMore && (
          <li>
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Ver más
            </button>
          </li>
        )}
      </ul>
    )}
  </div>
);
