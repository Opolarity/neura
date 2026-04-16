import { useState } from 'react';
import { ChevronDown, ChevronUp, Download, X, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ProductsExportModal } from './ProductsExportModal';
import type { ProductsDashboardState } from '../../hooks/useProductsDashboard';

interface Props {
  dash: ProductsDashboardState;
}

export function ProductsOptionsPanel({ dash }: Props) {
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);

  const {
    productSearch,
    setProductSearch,
    searchResults,
    selectedProductId,
    selectedProductTitle,
    selectProduct,
  } = dash;

  const hasSelectedProduct = selectedProductId !== null;
  const activeCount = hasSelectedProduct ? 1 : 0;
  const results = searchResults.data ?? [];
  const isSearching = searchResults.isFetching && productSearch.length >= 2;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          Más opciones
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          <span className="text-primary font-semibold">+</span>
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="flex flex-wrap items-end gap-3 px-4 pb-4 border-t pt-3">
          {/* Buscador de producto (combobox) */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Producto</span>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="h-9 w-[280px] justify-between font-normal"
                >
                  <span className="truncate">
                    {hasSelectedProduct ? selectedProductTitle : 'Buscar producto…'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
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
                            onSelect={() => {
                              selectProduct(r);
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedProductId === r.id ? 'opacity-100' : 'opacity-0',
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

          {/* Acciones */}
          <div className="ml-auto flex items-end gap-2">
            {hasSelectedProduct && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectProduct(null)}
                className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="h-9 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar reporte
            </Button>
          </div>
        </div>
      )}

      <ProductsExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
