import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MultiSelect } from '@/shared/components/MultiSelect';
import { OrderScopeFilters } from '../shared/OrderScopeFilters';
import { filterOptionsService } from '../../services/reports.service';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { defaultReturnSituationIds } from '../../types/reports.types';

/**
 * Campos de "Más filtros" de Cambios/Retornos.
 *
 * El retorno cuelga de un pedido, así que el universo se acota con los mismos
 * campos compartidos que Ventas (sede, canal, método de pago, lista de precios
 * y la cascada geográfica) más dos propios de esta pestaña: la situación del
 * retorno y su tipo.
 *
 * La situación NO es la de pedido: es el catálogo del módulo RTU (Aceptado,
 * Anulado, Pendiente), otro catálogo distinto, y por eso no reutiliza
 * `OrderSituationFilter` ni el campo `situationIds`.
 */
export function ReturnsOptionsPanel() {
  const { draft, setDraft } = useReportsFilters();

  const situations = useQuery({
    queryKey: ['filter_return_situations'],
    queryFn: filterOptionsService.getReturnSituations,
    staleTime: 1000 * 60 * 60,
  });

  const types = useQuery({
    queryKey: ['filter_return_types'],
    queryFn: filterOptionsService.getReturnTypes,
    staleTime: 1000 * 60 * 60,
  });

  const situationOptions = useMemo(() => situations.data ?? [], [situations.data]);
  const typeOptions = useMemo(() => types.data ?? [], [types.data]);

  // `null` no se escribe en el draft hasta que el usuario toca el filtro: así
  // el backend sigue resolviendo su propio default (solo Aceptado).
  const selectedSituations = useMemo(
    () => draft.returnSituationIds ?? defaultReturnSituationIds(situationOptions),
    [draft.returnSituationIds, situationOptions],
  );
  // El tipo no tiene default propio: sin tocar nada, entran los tres.
  const selectedTypes = useMemo(
    () => draft.returnTypeIds ?? typeOptions.map((t) => t.id),
    [draft.returnTypeIds, typeOptions],
  );

  return (
    <>
      <div className="flex flex-col gap-1 w-[200px]">
        <span className="text-xs text-muted-foreground font-medium">Situación del retorno</span>
        <MultiSelect
          className="h-9"
          options={situationOptions.map((s) => ({ label: s.name, value: s.id.toString() }))}
          value={selectedSituations.map((id) => id.toString())}
          onChange={(vals) => setDraft({ returnSituationIds: vals.map(Number) })}
          placeholder="Ninguna"
          showSelectAll
          selectAllLabel="Todas"
          maxVisible={1}
        />
      </div>

      <div className="flex flex-col gap-1 w-[200px]">
        <span className="text-xs text-muted-foreground font-medium">Tipo de retorno</span>
        <MultiSelect
          className="h-9"
          options={typeOptions.map((t) => ({ label: t.name, value: t.id.toString() }))}
          value={selectedTypes.map((id) => id.toString())}
          onChange={(vals) => setDraft({ returnTypeIds: vals.map(Number) })}
          placeholder="Ninguno"
          showSelectAll
          selectAllLabel="Todos"
          maxVisible={1}
        />
      </div>

      <OrderScopeFilters />
    </>
  );
}
