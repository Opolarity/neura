import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filterOptionsService } from '../../services/reports.service';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { MultiScopeFilter } from './MultiScopeFilter';

const ALL_VALUE = '__all__';

/**
 * Campos de "Más filtros" que acotan el universo de pedidos y no dependen de
 * la pestaña: sucursal, canal, método de pago, lista de precios y la cascada
 * geográfica. Los comparten Ventas y Productos.
 *
 * El filtro de situación NO vive acá a propósito: cada pestaña tiene su propio
 * campo y su propio default (Ventas mide lo pedido, Productos lo que salió del
 * almacén), así que lo renderiza cada panel.
 *
 * El contenedor (caja, toggle, Limpiar, Descargar, Aplicar) vive en
 * ReportsFilterBar.
 */
export function OrderScopeFilters() {
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

  return (
    <>
      {/* Sucursal */}
      <MultiScopeFilter
        label="Sucursal"
        options={(branches.data ?? []).map((b) => ({ value: b.id.toString(), label: b.name }))}
        value={draft.branchIds?.map(String) ?? null}
        onChange={(v) => setDraft({ branchIds: v?.map(Number) ?? null })}
        placeholder="Todas"
      />

      {/* Canal de venta */}
      <MultiScopeFilter
        label="Canal de venta"
        options={(saleTypes.data ?? []).map((st) => ({ value: st.id.toString(), label: st.name }))}
        value={draft.saleTypeIds?.map(String) ?? null}
        onChange={(v) => setDraft({ saleTypeIds: v?.map(Number) ?? null })}
        placeholder="Todos"
      />

      {/* Método de pago */}
      <MultiScopeFilter
        label="Método de pago"
        options={(paymentMethods.data ?? []).map((pm) => ({ value: pm.id.toString(), label: pm.name }))}
        value={draft.paymentMethodIds?.map(String) ?? null}
        onChange={(v) => setDraft({ paymentMethodIds: v?.map(Number) ?? null })}
        placeholder="Todos"
      />

      {/* Lista de precios */}
      <MultiScopeFilter
        label="Lista de precios"
        options={(priceLists.data ?? []).filter((pl) => pl.code).map((pl) => ({ value: pl.code!, label: pl.name }))}
        value={draft.priceListCodes}
        onChange={(v) => setDraft({ priceListCodes: v })}
        placeholder="Todas"
      />

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
