import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

const FinancialDashboard = lazy(() =>
  import('../components/financial/FinancialDashboard').then((m) => ({ default: m.FinancialDashboard })),
);

export default function MovementsPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes financieros</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar />
      <Suspense fallback={<TabSkeleton />}>
        <FinancialDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
