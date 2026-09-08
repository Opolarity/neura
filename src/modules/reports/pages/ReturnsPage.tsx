import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

const ReturnsDashboard = lazy(() =>
  import('../components/returns/ReturnsDashboard').then((m) => ({ default: m.ReturnsDashboard })),
);

export default function ReturnsPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de cambios/retornos</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar />
      <Suspense fallback={<TabSkeleton />}>
        <ReturnsDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
