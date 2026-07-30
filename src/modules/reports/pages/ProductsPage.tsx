import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ProductsOptionsPanel } from '../components/products/ProductsOptionsPanel';
import { useProductsDashboard } from '../hooks/useProductsDashboard';

const ProductsDashboard = lazy(() =>
  import('../components/products/ProductsDashboard').then((m) => ({ default: m.ProductsDashboard })),
);

export default function ProductsPage() {
  const { filters, onChange } = useReportsFilters();
  const dash = useProductsDashboard(filters);
  return (
    <div className="space-y-4">
      <ProductsOptionsPanel dash={dash} filters={filters} onChange={onChange} />
      <Suspense fallback={<TabSkeleton />}>
        <ProductsDashboard dash={dash} />
      </Suspense>
    </div>
  );
}
