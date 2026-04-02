import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';

const FinancialDashboard = lazy(() =>
  import('../components/financial/FinancialDashboard').then((m) => ({ default: m.FinancialDashboard })),
);

export default function MovementsPage() {
  const { filters } = useReportsFilters();
  return (
    <Suspense fallback={<TabSkeleton />}>
      <FinancialDashboard filters={filters} />
    </Suspense>
  );
}
