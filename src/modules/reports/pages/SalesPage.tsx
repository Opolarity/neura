import { Suspense, lazy, useEffect, useState } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { SalesGeoFilters } from '../components/sales/SalesGeoFilters';
import type { SalesExtraFilters } from '../services/reports.service';

const SalesDashboard = lazy(() =>
  import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })),
);

export default function SalesPage() {
  const { filters, applyVersion } = useReportsFilters();
  // Filtros propios de Ventas (producto específico, rango de monto): NO viven en el
  // ReportsFilters compartido a propósito — si se agregaran ahí, cada otra pestaña
  // (Productos, Stock, Devoluciones, Clientes, Financiero) mandaría estos parámetros
  // a SPs que no los aceptan.
  // Tienen su propio borrador/aplicado, sincronizado con el botón "Aplicar" de arriba
  // vía applyVersion (un solo click aplica fechas + geo + estos filtros a la vez).
  const [extraDraft, setExtraDraft] = useState<SalesExtraFilters>({});
  const [extraApplied, setExtraApplied] = useState<SalesExtraFilters>({});

  useEffect(() => {
    setExtraApplied(extraDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion]);

  function clearExtra() {
    setExtraDraft({});
    setExtraApplied({});
  }

  return (
    <div className="space-y-4">
      <SalesGeoFilters
        extraDraft={extraDraft}
        onExtraDraftChange={setExtraDraft}
        appliedExtra={extraApplied}
        onClearExtra={clearExtra}
      />
      <Suspense fallback={<TabSkeleton />}>
        <SalesDashboard filters={filters} extra={extraApplied} />
      </Suspense>
    </div>
  );
}
