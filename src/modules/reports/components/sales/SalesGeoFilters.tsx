import { OrderSituationFilter } from '../shared/OrderSituationFilter';
import { OrderScopeFilters } from '../shared/OrderScopeFilters';
import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { defaultSituationIds } from '../../types/reports.types';

/** Solo devuelve los campos de "Más filtros" de Ventas — el contenedor (caja,
 * toggle, Limpiar, Descargar, Aplicar) vive en ReportsFilterBar.
 *
 * Salvo el estado de pedido, que tiene default propio, los campos son los
 * mismos que usa Productos: viven en OrderScopeFilters. */
export function SalesGeoFilters() {
  const { draft, setDraft } = useReportsFilters();

  return (
    <>
      {/* Estado de pedido — el default de Ventas cuenta todo menos cancelado y reembolsado */}
      <OrderSituationFilter
        value={draft.situationIds}
        onChange={(ids) => setDraft({ situationIds: ids })}
        defaultIds={defaultSituationIds}
      />

      <OrderScopeFilters />
    </>
  );
}
