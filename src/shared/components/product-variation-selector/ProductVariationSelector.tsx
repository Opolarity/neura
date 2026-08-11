import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Image as ImageIcon, Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/utils";
import {
  fetchProductVariations,
  fetchProducts,
} from "./ProductVariationSelector.service";
import {
  productVariationsFromApiAdapter,
  productsFromApiAdapter,
} from "./ProductVariationSelector.adapter";
import type {
  ProductVariationOption,
  ProductSelectorMode,
} from "./ProductVariationSelector.types";

interface ProductVariationSelectorProps {
  /** Selección simple (modo por defecto). En modo múltiple no se usan. */
  selectedVariation?: ProductVariationOption | null;
  onSelect?: (variation: ProductVariationOption) => void;
  stockTypeId?: number;
  warehouseId?: number;
  disabled?: boolean;
  placeholder?: string;
  showStock?: boolean;
  /** Unidad a buscar: variaciones (default) o productos. */
  mode?: ProductSelectorMode;
  /**
   * Selección múltiple: el estado pasa a `selectedItems` / `onChangeItems`
   * (`selectedVariation` / `onSelect` se ignoran) y cada click hace toggle.
   */
  multiple?: boolean;
  selectedItems?: ProductVariationOption[];
  onChangeItems?: (items: ProductVariationOption[]) => void;
  /**
   * Mantener el popover abierto tras seleccionar. Por defecto `false`: se cierra
   * al seleccionar, como espera el punto de venta (el Enter del lector de
   * códigos de barras cierra la lista tras agregar el producto).
   */
  keepOpenOnSelect?: boolean;
  /** Chips de los seleccionados encima del trigger (solo en modo múltiple). */
  showSelectedChips?: boolean;
  /**
   * Escaneo por código de barras: se invoca con el texto tipeado al presionar
   * Enter (el lector HID emite Enter al final). Si devuelve `true` (producto
   * agregado), se limpia el input; si no, se conserva el texto para que la
   * búsqueda debounced muestre los candidatos.
   */
  onScan?: (code: string) => Promise<boolean> | boolean;
}

const PAGE_SIZE = 10;

export default function ProductVariationSelector({
  selectedVariation = null,
  onSelect,
  stockTypeId,
  warehouseId,
  disabled = false,
  placeholder = "Buscar por nombre o SKU...",
  showStock = true,
  mode = "variation",
  multiple = false,
  selectedItems,
  onChangeItems,
  keepOpenOnSelect = false,
  showSelectedChips = true,
  onScan,
}: ProductVariationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [variations, setVariations] = useState<ProductVariationOption[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, size: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const hasLoadedRef = useRef(false);

  const totalPages = Math.ceil(pagination.total / pagination.size);
  const selected = selectedItems ?? [];
  const showStockColumn = showStock && mode === "variation";

  const loadData = async (p: number, q: string) => {
    try {
      setLoading(true);
      const adapted =
        mode === "product"
          ? productsFromApiAdapter(
              await fetchProducts({
                page: p,
                size: PAGE_SIZE,
                search: q || undefined,
              }),
            )
          : productVariationsFromApiAdapter(
              await fetchProductVariations({
                page: p,
                size: PAGE_SIZE,
                search: q || undefined,
                stockTypeId,
                warehouseId,
              }),
            );
      setVariations(adapted.data);
      setPagination(adapted.pagination);
    } catch (error) {
      console.error("Error loading product variations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load the first time the popover is opened; keep results/search across
  // subsequent open/close cycles instead of reloading every time it reopens.
  useEffect(() => {
    if (!open || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setPage(1);
    loadData(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reload only when the stock type / warehouse filters actually change
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    setPage(1);
    loadData(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockTypeId, warehouseId]);

  // Debounced search
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadData(1, search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(newPage, search);
  };

  const handleSelect = (variation: ProductVariationOption) => {
    if (multiple) {
      const exists = selected.some((item) => item.id === variation.id);
      onChangeItems?.(
        exists
          ? selected.filter((item) => item.id !== variation.id)
          : [...selected, variation],
      );
    } else {
      onSelect?.(variation);
    }
    if (!keepOpenOnSelect) setOpen(false);
  };

  const isChecked = (variation: ProductVariationOption) =>
    multiple
      ? selected.some((item) => item.id === variation.id)
      : selectedVariation?.id === variation.id;

  const optionLabel = (option: ProductVariationOption) => {
    const terms = option.terms.map((t) => t.name).join(" / ");
    if (!terms) return option.sku ? `${option.productTitle} (${option.sku})` : option.productTitle;
    return `${option.productTitle} - ${terms}`;
  };

  const triggerLabel = () => {
    if (multiple) {
      if (selected.length === 0) return placeholder;
      return `${selected.length} seleccionado${selected.length === 1 ? "" : "s"}`;
    }
    if (!selectedVariation) return placeholder;
    return `${selectedVariation.productTitle} - ${selectedVariation.terms.map((t) => t.name).join(" / ") || selectedVariation.sku}`;
  };

  const selector = (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-start text-muted-foreground font-normal"
        >
          <Search className="w-4 h-4 mr-2" />
          {triggerLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-popover">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar producto o SKU..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={
              onScan
                ? async (e) => {
                    if (e.key !== "Enter") return;
                    // Evitar que cmdk seleccione el item resaltado con el
                    // Enter que emite el lector de códigos de barras.
                    e.preventDefault();
                    e.stopPropagation();
                    const added = await onScan(search);
                    if (added) setSearch("");
                  }
                : undefined
            }
          />

          <CommandList>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No se encontraron productos.</CommandEmpty>
                <CommandGroup>
                  {variations.map((variation) => {
                    const termsNames = variation.terms
                      .map((t) => t.name)
                      .join(" / ");
                    const displayTerms = termsNames
                      ? `${termsNames} (${variation.sku})`
                      : variation.sku;
                    return (
                      <CommandItem
                        key={variation.id}
                        value={`${variation.productTitle} ${variation.sku} ${termsNames}`}
                        onSelect={() => handleSelect(variation)}
                        className="flex items-center gap-3 py-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isChecked(variation) ? "opacity-100" : "opacity-0",
                          )}
                        />

                        {/* Product Image */}
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                          {variation.imageUrl ? (
                            <img
                              src={variation.imageUrl}
                              alt={variation.productTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        {/* Product Info */}
                        <div className="flex flex-1 flex-col min-w-0">
                          <span className="font-medium truncate">
                            {variation.productTitle}
                          </span>
                          {displayTerms && (
                            <span className="text-sm text-muted-foreground truncate">
                              {displayTerms}
                            </span>
                          )}
                        </div>
                        {/* Stock */}
                        {showStockColumn && (
                          <span
                            className={cn(
                              "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                              variation.stock > 0
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive",
                            )}
                          >
                            {variation.stock}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50">
              <span className="text-xs text-muted-foreground">
                {(page - 1) * pagination.size + 1}-
                {Math.min(page * pagination.size, pagination.total)}{" "}
                de {pagination.total}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (!multiple || !showSelectedChips) return selector;

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="text-xs font-normal gap-1 pr-1"
            >
              <span className="truncate max-w-[220px]">{optionLabel(item)}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Quitar ${optionLabel(item)}`}
                className="rounded-sm hover:bg-muted-foreground/20 disabled:opacity-50"
                onClick={() =>
                  onChangeItems?.(selected.filter((s) => s.id !== item.id))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {selector}
    </div>
  );
}
