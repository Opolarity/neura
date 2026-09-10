import { useReportsFilters } from '../../context/ReportsFiltersContext';
import { OrderSituationFilter } from '../shared/OrderSituationFilter';
import { OrderScopeFilters } from '../shared/OrderScopeFilters';
import { defaultProductSituationIds } from '../../types/reports.types';

/** Solo devuelve los campos de "Más filtros" de Productos — el contenedor
 * (caja, toggle, Limpiar, Descargar, Aplicar) vive en ReportsFilterBar. El
 * buscador de producto no está acá: vive en la tarjeta "Análisis de producto
 * individual" (ProductPicker), porque solo afecta a esa sección. */
export function ProductsOptionsPanel() {
  const { draft, setDraft } = useReportsFilters();

  return (
    <>
      {/* Estado de pedido — su default es solo Enviado y Entregado, no el de Ventas */}
      <OrderSituationFilter
        value={draft.productSituationIds}
        onChange={(ids) => setDraft({ productSituationIds: ids })}
        defaultIds={defaultProductSituationIds}
      />

      <OrderScopeFilters />
    </>
  );
}
