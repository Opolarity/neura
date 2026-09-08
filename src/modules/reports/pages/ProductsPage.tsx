import { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { filterOptionsService } from '../services/reports.service';
import { defaultProductSituationIds, isSameIdSet } from '../types/reports.types';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { ProductsOptionsPanel } from '../components/products/ProductsOptionsPanel';
import { ProductsExportModal } from '../components/products/ProductsExportModal';
import { useProductsDashboard } from '../hooks/useProductsDashboard';

const ProductsDashboard = lazy(() =>
  import('../components/products/ProductsDashboard').then((m) => ({ default: m.ProductsDashboard })),
);

export default function ProductsPage() {
  const { filters, draft, applyImmediate, applyVersion } = useReportsFilters();
  const dash = useProductsDashboard(filters, applyVersion);
  const [exportOpen, setExportOpen] = useState(false);

  // El catálogo ya está cacheado por el filtro de situación; se lee aquí solo
  // para saber si la selección difiere del default y encender el badge.
  const situations = useQuery({
    queryKey: ['filter_order_situations'],
    queryFn: filterOptionsService.getOrderSituations,
    staleTime: 1000 * 60 * 60,
  });

  const situationIsDefault =
    draft.productSituationIds === null ||
    isSameIdSet(draft.productSituationIds, defaultProductSituationIds(situations.data ?? []));

  const extraActiveCount =
    [
      dash.selectedProductId,
      draft.branchId,
      draft.saleTypeId,
    ].filter((v) => v !== null && v !== undefined).length + (situationIsDefault ? 0 : 1);

  function handleClearExtra() {
    dash.selectProduct(null);
    applyImmediate({ ...draft, branchId: null, saleTypeId: null, productSituationIds: null });
  }

  return (
    <div className="space-y-4">
      <ReportsFilterBar
        extraFields={<ProductsOptionsPanel dash={dash} />}
        extraActiveCount={extraActiveCount}
        extraDirty={dash.isProductDirty}
        onClearExtra={handleClearExtra}
        exportSlot={
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Descargar reporte
          </Button>
        }
      />
      <ProductsExportModal open={exportOpen} onOpenChange={setExportOpen} />
      <Suspense fallback={<TabSkeleton />}>
        <ProductsDashboard dash={dash} />
      </Suspense>
    </div>
  );
}
