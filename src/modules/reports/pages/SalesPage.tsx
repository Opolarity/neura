import { Suspense, lazy, useState } from 'react';
import { useReportsFilters } from '../context/ReportsFiltersContext';
import { TabSkeleton } from '../components/shared/TabSkeleton';
import { SalesGeoFilters } from '../components/sales/SalesGeoFilters';
import type { SalesExtraFilters } from '../services/reports.service';

const SalesDashboard = lazy(() =>
  import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })),
);

export default function SalesPage() {
  const { filters, onChange } = useReportsFilters();
  // Filtros propios de Ventas (producto específico, rango de monto): NO viven en el
  // ReportsFilters compartido a propósito — si se agregaran ahí, cada otra pestaña
  // (Productos, Stock, Devoluciones, Clientes, Financiero) mandaría estos parámetros
  // a SPs que no los aceptan.
  const [extra, setExtra] = useState<SalesExtraFilters>({});

  return (
    <div className="space-y-4">
      <SalesGeoFilters filters={filters} onChange={onChange} extra={extra} onExtraChange={setExtra} />
      <Suspense fallback={<TabSkeleton />}>
        <SalesDashboard filters={filters} extra={extra} />
      </Suspense>
    </div>
  );
}
