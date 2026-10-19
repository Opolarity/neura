import { useState } from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/shared/utils/utils';
import type { ProductsDashboardState } from '../../hooks/useProductsDashboard';

interface Props {
  dash: ProductsDashboardState;
}

/**
 * Buscador + Aplicar de "Análisis de producto individual". Vive dentro de esa
 * tarjeta y no en "Más filtros": el producto solo afecta a esa sección, así
 * que su Aplicar no toca los KPIs ni los gráficos de arriba. Los filtros de
 * la barra (fechas, sede, canal, estado…) sí se le aplican, pero solo los ya
 * aplicados — no el borrador.
 */
export function ProductPicker({ dash }: Props) {
  const [comboOpen, setComboOpen] = useState(false);

  const {
    productSearch,
    setProductSearch,
    searchResults,
    selectedProducts,
    appliedProducts,
    toggleProduct,
    applyProducts,
    isProductDirty,
  } = dash;

  const hasSelectedProduct = selectedProducts.length > 0;
  const triggerLabel =
    selectedProducts.length === 0
      ? 'Buscar producto…'
      : selectedProducts.length === 1
        ? selectedProducts[0].title
        : `${selectedProducts.length} productos`;
  const results = searchResults.data ?? [];
  const isSearching = searchResults.isFetching && productSearch.length >= 2;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Producto</span>
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboOpen}
              className="h-9 w-[320px] justify-between font-normal"
            >
              <span className="truncate">
                {triggerLabel}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Nombre o SKU…"
                value={productSearch}
                onValueChange={setProductSearch}
              />
              <CommandList>
                {productSearch.length < 2 ? (
                  <CommandEmpty>Escribe al menos 2 caracteres…</CommandEmpty>
                ) : isSearching ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando…
                  </div>
                ) : results.length === 0 ? (
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {results.map((r) => (
                      <CommandItem
                        key={r.id}
                        value={`${r.id}`}
                        // T-560: se pueden marcar varios; el popover queda abierto.
                        onSelect={() => toggleProduct(r)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedProducts.some((p) => p.id === r.id) ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-sm">{r.title}</span>
                          <span className="truncate text-xs text-muted-foreground">{r.sku}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        {(hasSelectedProduct || appliedProducts.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toggleProduct(null);
              applyProducts([]);
            }}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </Button>
        )}
        <Button size="sm" onClick={() => applyProducts()} disabled={!isProductDirty} className="gap-1.5">
          <Check className="h-4 w-4" />
          Aplicar
        </Button>
      </div>

      {/* T-560: productos marcados (se quitan uno a uno) */}
      {selectedProducts.length > 1 && (
        <div className="flex w-full flex-wrap gap-1.5">
          {selectedProducts.map((p) => (
            <Badge key={p.id} variant="secondary" className="gap-1 font-normal">
              <span className="max-w-[220px] truncate">{p.title}</span>
              <button
                type="button"
                onClick={() => toggleProduct(p)}
                aria-label={`Quitar ${p.title}`}
                className="rounded-sm opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
