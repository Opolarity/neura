import { Suspense, lazy, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { SalesGeoFilters } from '../components/sales/SalesGeoFilters';
import { SalesExportModal } from '../components/shared/SalesExportModal';
import type { SalesExtraFilters } from '../services/reports.service';

const SalesDashboard = lazy(() =>
  import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })),
);

export default function SalesPage() {
  const { filters, draft, applyImmediate, applyVersion } = useReportsFilters();
  // Filtros propios de Ventas (producto específico, rango de monto): NO viven en el
  // ReportsFilters compartido a propósito — si se agregaran ahí, cada otra pestaña
  // (Productos, Stock, Devoluciones, Clientes, Financiero) mandaría estos parámetros
  // a SPs que no los aceptan.
  // Tienen su propio borrador/aplicado, sincronizado con el botón "Aplicar" de arriba
  // vía applyVersion (un solo click aplica fechas + geo + estos filtros a la vez).
  const [extraDraft, setExtraDraft] = useState<SalesExtraFilters>({});
  const [extraApplied, setExtraApplied] = useState<SalesExtraFilters>({});
  const [exportOpen, setExportOpen] = useState(false);

  const isExtraDirty = JSON.stringify(extraDraft) !== JSON.stringify(extraApplied);

  function handleExtraDraftChange(partial: Partial<SalesExtraFilters>) {
    setExtraDraft((prev) => ({ ...prev, ...partial }));
  }

  useEffect(() => {
    setExtraApplied(extraDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion]);

  const extraActiveCount = [
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

  function handleClearExtra() {
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
    setExtraDraft({});
    setExtraApplied({});
  }

  return (
    <div className="space-y-4">
      <ReportsFilterBar
        extraFields={<SalesGeoFilters extraDraft={extraDraft} onExtraDraftChange={handleExtraDraftChange} />}
        extraActiveCount={extraActiveCount}
        extraDirty={isExtraDirty}
        onClearExtra={handleClearExtra}
        exportSlot={
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Descargar
          </Button>
        }
      />
      <SalesExportModal open={exportOpen} onOpenChange={setExportOpen} filters={filters} extra={extraApplied} />
      <Suspense fallback={<TabSkeleton />}>
        <SalesDashboard filters={filters} extra={extraApplied} />
      </Suspense>
    </div>
  );
}
