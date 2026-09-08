import { Suspense, lazy } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

const CustomersDashboard = lazy(() =>
  import('../components/customers/CustomersDashboard').then((m) => ({ default: m.CustomersDashboard })),
);

export default function ClientsPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de clientes</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar />
      <Suspense fallback={<TabSkeleton />}>
        <CustomersDashboard filters={filters} />
      </Suspense>
    </div>
  );
}
