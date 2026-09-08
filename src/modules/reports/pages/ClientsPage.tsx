import { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { filterOptionsService } from '../services/reports.service';
import { defaultSituationIds, isSameIdSet } from '../types/reports.types';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { OrderSituationFilter } from '../components/shared/OrderSituationFilter';

const CustomersDashboard = lazy(() =>
  import('../components/customers/CustomersDashboard').then((m) => ({ default: m.CustomersDashboard })),
);

export default function ClientsPage() {
  const { filters, draft, setDraft, applyImmediate } = useReportsFilters();

  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  const situationIsDefault =
    draft.situationIds === null ||
    isSameIdSet(draft.situationIds, defaultSituationIds(situations.data ?? []));

  const extraActiveCount = situationIsDefault ? 0 : 1;

  function handleClearExtra() {
    applyImmediate({ ...draft, situationIds: null });
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de clientes</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar
        // Mismo filtro y mismo default que Ventas: cuenta todo menos cancelado
        // y reembolsado. Antes la pestaña no tenía ningún filtro más que la
        // fecha y contaba los cancelados, así que su ticket promedio no
        // coincidía con el de Ventas.
        extraFields={
          <OrderSituationFilter
            value={draft.situationIds}
            onChange={(ids) => setDraft({ situationIds: ids })}
            defaultIds={defaultSituationIds}
          />
        }
        extraActiveCount={extraActiveCount}
        onClearExtra={handleClearExtra}
        footNote={
          <>
            Un <strong className="font-medium text-foreground">cliente</strong> es cualquiera con
            al menos una compra, tenga cuenta o no, identificado por su DNI/RUC. Las ventas sin
            documento, sin cuenta y sin nombre se agrupan en un único{' '}
            <strong className="font-medium text-foreground">Sin identificar</strong>, que en Top
            clientes aparece como una fila con muchas compras: es mostrador sin identificar, no
            una persona.{' '}
            <strong className="font-medium text-foreground">Distribución de lealtad</strong> solo
            cubre a los clientes con cuenta, porque el nivel vive en su ficha.{' '}
            <strong className="font-medium text-foreground">Próximos cumpleaños</strong> mira
            hacia adelante y no depende del rango elegido.
          </>
        }
      />
      <Suspense fallback={<TabSkeleton />}>
        <CustomersDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
