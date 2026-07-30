import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Download, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/shared/utils/utils';
import { filterOptionsService, productsService } from '../../services/reports.service';
import type { SalesExtraFilters } from '../../services/reports.service';
import { SalesExportModal } from '../shared/SalesExportModal';
import { useReportsFilters } from '../../context/ReportsFiltersContext';

interface Props {
  extraDraft: SalesExtraFilters;
  onExtraDraftChange: (partial: Partial<SalesExtraFilters>) => void;
  appliedExtra: SalesExtraFilters;
  onClearExtra: () => void;
}

const ALL_VALUE = '__all__';

export function SalesGeoFilters({ extraDraft, onExtraDraftChange, appliedExtra, onClearExtra }: Props) {
  const { draft, setDraft, applyImmediate, filters } = useReportsFilters();
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const debouncedSearch = useDebounce(productSearch, 400);

  const productResults = useQuery({
    queryKey: ['rpt_product_search', debouncedSearch],
    queryFn: () => productsService.search(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const countries = useQuery({
    queryKey: ['filter_countries'],
    queryFn: filterOptionsService.getCountries,
    staleTime: 1000 * 60 * 60,
  });

  const states = useQuery({
    queryKey: ['filter_states', draft.countryId],
    queryFn: () => filterOptionsService.getStates(draft.countryId!),
    enabled: draft.countryId !== null,
    staleTime: 1000 * 60 * 30,
  });

  const cities = useQuery({
    queryKey: ['filter_cities', draft.stateId],
    queryFn: () => filterOptionsService.getCities(draft.stateId!),
    enabled: draft.stateId !== null,
    staleTime: 1000 * 60 * 30,
  });

  const neighborhoods = useQuery({
    queryKey: ['filter_neighborhoods', draft.cityId],
    queryFn: () => filterOptionsService.getNeighborhoods(draft.cityId!),
    enabled: draft.cityId !== null,
    staleTime: 1000 * 60 * 30,
  });

  const branches = useQuery({
    queryKey: ['filter_branches'],
    queryFn: filterOptionsService.getBranches,
    staleTime: 1000 * 60 * 10,
  });

  const saleTypes = useQuery({
    queryKey: ['filter_sale_types'],
    queryFn: filterOptionsService.getSaleTypes,
    staleTime: 1000 * 60 * 60,
  });

  const paymentMethods = useQuery({
    queryKey: ['filter_payment_methods'],
    queryFn: filterOptionsService.getPaymentMethods,
    staleTime: 1000 * 60 * 60,
  });

  const activeCount = [
    draft.branchId,
    draft.countryId,
    draft.stateId,
    draft.cityId,
    draft.neighborhoodId,
    draft.saleTypeId,
    draft.paymentMethodId,
    extraDraft.productId,
    extraDraft.minTotal,
    extraDraft.maxTotal,
  ].filter((v) => v !== null && v !== undefined).length;

  const hasActiveFilter = activeCount > 0;

  function clearAll() {
    applyImmediate({
      ...draft,
      branchId: null,
      countryId: null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
      saleTypeId: null,
      paymentMethodId: null,
    });
    onClearExtra();
    setProductTitle('');
    setProductSearch('');
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          Más filtros
          {hasActiveFilter && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          <span className="text-primary font-semibold">+</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="flex flex-wrap items-end gap-3 px-4 pb-4 border-t pt-3">

          {/* Sucursal */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Sucursal</span>
            <Select
              value={draft.branchId?.toString() ?? ALL_VALUE}
              onValueChange={(v) =>
                setDraft({ branchId: v === ALL_VALUE ? null : Number(v) })
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                {branches.data?.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Canal de venta */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Canal de venta</span>
            <Select
              value={draft.saleTypeId?.toString() ?? ALL_VALUE}
              onValueChange={(v) =>
                setDraft({ saleTypeId: v === ALL_VALUE ? null : Number(v) })
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {saleTypes.data?.map((st) => (
                  <SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método de pago */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Método de pago</span>
            <Select
              value={draft.paymentMethodId?.toString() ?? ALL_VALUE}
              onValueChange={(v) =>
                setDraft({ paymentMethodId: v === ALL_VALUE ? null : Number(v) })
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {paymentMethods.data?.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Producto específico */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Producto</span>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="h-9 w-[220px] justify-between font-normal"
                >
                  <span className="truncate">
                    {extraDraft.productId ? productTitle : 'Todos'}
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
                    ) : productResults.isFetching ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Buscando…
                      </div>
                    ) : (productResults.data ?? []).length === 0 ? (
                      <CommandEmpty>Sin resultados.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {(productResults.data ?? []).map((r) => (
                          <CommandItem
                            key={r.id}
                            value={`${r.id}`}
                            onSelect={() => {
                              onExtraDraftChange({ productId: r.id });
                              setProductTitle(r.title);
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                extraDraft.productId === r.id ? 'opacity-100' : 'opacity-0',
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

          {/* Monto de compra */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Monto mín. (S/.)</span>
            <Input
              type="number"
              min={0}
              className="h-9 w-[110px]"
              value={extraDraft.minTotal ?? ''}
              onChange={(e) => onExtraDraftChange({ minTotal: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Monto máx. (S/.)</span>
            <Input
              type="number"
              min={0}
              className="h-9 w-[110px]"
              value={extraDraft.maxTotal ?? ''}
              onChange={(e) => onExtraDraftChange({ maxTotal: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>

          {/* País */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">País</span>
            <Select
              value={draft.countryId?.toString() ?? ALL_VALUE}
              onValueChange={(v) => {
                const countryId = v === ALL_VALUE ? null : Number(v);
                setDraft({ countryId, stateId: null, cityId: null, neighborhoodId: null });
              }}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {countries.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Departamento */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Departamento</span>
            <Select
              value={draft.stateId?.toString() ?? ALL_VALUE}
              disabled={!draft.countryId}
              onValueChange={(v) => {
                const stateId = v === ALL_VALUE ? null : Number(v);
                setDraft({ stateId, cityId: null, neighborhoodId: null });
              }}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {states.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provincia */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Provincia</span>
            <Select
              value={draft.cityId?.toString() ?? ALL_VALUE}
              disabled={!draft.stateId}
              onValueChange={(v) => {
                const cityId = v === ALL_VALUE ? null : Number(v);
                setDraft({ cityId, neighborhoodId: null });
              }}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                {cities.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distrito */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Distrito</span>
            <Select
              value={draft.neighborhoodId?.toString() ?? ALL_VALUE}
              disabled={!draft.cityId}
              onValueChange={(v) =>
                setDraft({ neighborhoodId: v === ALL_VALUE ? null : Number(v) })
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {neighborhoods.data?.map((n) => (
                  <SelectItem key={n.id} value={n.id.toString()}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Separador visual */}
          <div className="ml-auto flex items-end gap-2">
            {/* Limpiar */}
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </Button>
            )}

            {/* Descargar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="h-9 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar
            </Button>
          </div>
        </div>
      )}

      <SalesExportModal open={exportOpen} onOpenChange={setExportOpen} filters={filters} extra={appliedExtra} />
    </div>
  );
}
