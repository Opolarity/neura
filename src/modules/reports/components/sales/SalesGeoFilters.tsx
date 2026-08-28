import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/shared/components/MultiSelect';
import { filterOptionsService } from '../../services/reports.service';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { defaultSituationIds } from '../../types/reports.types';

const ALL_VALUE = '__all__';

/** Solo devuelve los campos de "Más filtros" de Ventas — el contenedor (caja,
 * toggle, Limpiar, Descargar, Aplicar) vive en ReportsFilterBar. */
export function SalesGeoFilters() {
  const { draft, setDraft } = useReportsFilters();

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

  const priceLists = useQuery({
    queryKey: ['filter_price_lists'],
    queryFn: filterOptionsService.getPriceLists,
    staleTime: 1000 * 60 * 60,
  });

  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  // `situationIds` en null significa "el default del backend": se muestra
  // marcado todo menos Cancelado y Reembolsado, sin escribir nada en el draft
  // hasta que el usuario toque el filtro.
  const situationOptions = situations.data ?? [];
  const selectedSituations = useMemo(
    () => draft.situationIds ?? defaultSituationIds(situationOptions),
    [draft.situationIds, situationOptions],
  );

  return (
    <>
      {/* Estado de pedido */}
      <div className="flex flex-col gap-1 w-[200px]">
        <span className="text-xs text-muted-foreground font-medium">Estado de pedido</span>
        <MultiSelect
          className="h-9"
          options={situationOptions.map((s) => ({ label: s.name, value: s.id.toString() }))}
          value={selectedSituations.map((id) => id.toString())}
          onChange={(vals) => setDraft({ situationIds: vals.map(Number) })}
          placeholder="Ninguno"
          showSelectAll
          selectAllLabel="Todos"
          maxVisible={1}
        />
      </div>

      {/* Sucursal */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Sucursal</span>
        <Select
          value={draft.branchId?.toString() ?? ALL_VALUE}
          onValueChange={(v) => setDraft({ branchId: v === ALL_VALUE ? null : Number(v) })}
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
          onValueChange={(v) => setDraft({ saleTypeId: v === ALL_VALUE ? null : Number(v) })}
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
          onValueChange={(v) => setDraft({ paymentMethodId: v === ALL_VALUE ? null : Number(v) })}
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

      {/* Lista de precios */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">Lista de precios</span>
        <Select
          value={draft.priceListCode ?? ALL_VALUE}
          onValueChange={(v) => setDraft({ priceListCode: v === ALL_VALUE ? null : v })}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {priceLists.data?.map((pl) => (
              <SelectItem key={pl.id} value={pl.code!}>{pl.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          onValueChange={(v) => setDraft({ neighborhoodId: v === ALL_VALUE ? null : Number(v) })}
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
    </>
  );
}
