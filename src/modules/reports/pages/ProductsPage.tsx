import { Suspense, lazy, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReportsFilters } from '../context/ReportsFiltersContext';
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

  const extraActiveCount = [
    dash.selectedProductId,
    draft.branchId,
    draft.saleTypeId,
  ].filter((v) => v !== null && v !== undefined).length;

  function handleClearExtra() {
    dash.selectProduct(null);
    applyImmediate({ ...draft, branchId: null, saleTypeId: null });
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
