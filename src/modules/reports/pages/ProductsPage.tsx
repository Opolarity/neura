import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ProductsOptionsPanel } from '../components/products/ProductsOptionsPanel';

const ProductsDashboard = lazy(() =>
  import('../components/products/ProductsDashboard').then((m) => ({ default: m.ProductsDashboard })),
);

export default function ProductsPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <ProductsOptionsPanel />
      <Suspense fallback={<TabSkeleton />}>
        <ProductsDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
