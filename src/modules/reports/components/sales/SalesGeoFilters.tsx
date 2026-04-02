import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { filterOptionsService } from '../../services/reports.service';
import type { ReportsFilters } from '../../types/reports.types';

interface Props {
  filters: ReportsFilters;
  onChange: (partial: Partial<ReportsFilters>) => void;
}

const ALL_VALUE = '__all__';

export function SalesGeoFilters({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const countries = useQuery({
    queryKey: ['filter_countries'],
    queryFn: filterOptionsService.getCountries,
    staleTime: 1000 * 60 * 60,
  });

  const states = useQuery({
    queryKey: ['filter_states', filters.countryId],
    queryFn: () => filterOptionsService.getStates(filters.countryId!),
    enabled: filters.countryId !== null,
    staleTime: 1000 * 60 * 30,
  });

  const cities = useQuery({
    queryKey: ['filter_cities', filters.stateId],
    queryFn: () => filterOptionsService.getCities(filters.stateId!),
    enabled: filters.stateId !== null,
    staleTime: 1000 * 60 * 30,
  });

  const neighborhoods = useQuery({
    queryKey: ['filter_neighborhoods', filters.cityId],
    queryFn: () => filterOptionsService.getNeighborhoods(filters.cityId!),
    enabled: filters.cityId !== null,
    staleTime: 1000 * 60 * 30,
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
    filters.countryId,
    filters.stateId,
    filters.cityId,
    filters.neighborhoodId,
    filters.saleTypeId,
    filters.paymentMethodId,
  ].filter(Boolean).length;

  const hasActiveFilter = activeCount > 0;

  function clearAll() {
    onChange({
      countryId: null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
      saleTypeId: null,
      paymentMethodId: null,
    });
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

          {/* Canal de venta */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Canal de venta</span>
            <Select
              value={filters.saleTypeId?.toString() ?? ALL_VALUE}
              onValueChange={(v) =>
                onChange({ saleTypeId: v === ALL_VALUE ? null : Number(v) })
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
              value={filters.paymentMethodId?.toString() ?? ALL_VALUE}
              onValueChange={(v) =>
                onChange({ paymentMethodId: v === ALL_VALUE ? null : Number(v) })
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

          {/* País */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">País</span>
            <Select
              value={filters.countryId?.toString() ?? ALL_VALUE}
              onValueChange={(v) => {
                const countryId = v === ALL_VALUE ? null : Number(v);
                onChange({ countryId, stateId: null, cityId: null, neighborhoodId: null });
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
              value={filters.stateId?.toString() ?? ALL_VALUE}
              disabled={!filters.countryId}
              onValueChange={(v) => {
                const stateId = v === ALL_VALUE ? null : Number(v);
                onChange({ stateId, cityId: null, neighborhoodId: null });
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
              value={filters.cityId?.toString() ?? ALL_VALUE}
              disabled={!filters.stateId}
              onValueChange={(v) => {
                const cityId = v === ALL_VALUE ? null : Number(v);
                onChange({ cityId, neighborhoodId: null });
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
              value={filters.neighborhoodId?.toString() ?? ALL_VALUE}
              disabled={!filters.cityId}
              onValueChange={(v) =>
                onChange({ neighborhoodId: v === ALL_VALUE ? null : Number(v) })
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
        </div>
      )}
    </div>
  );
}
