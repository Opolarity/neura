import { Suspense, lazy, useState } from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';
import {
  ShoppingCart, Package, Warehouse, RotateCcw, DollarSign, Users,
} from 'lucide-react';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import type { ReportsFilters } from '../types/reports.types';
import { DEFAULT_REPORTS_FILTERS } from '../types/reports.types';

const SalesDashboard    = lazy(() => import('../components/sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })));
const ProductsDashboard = lazy(() => import('../components/products/ProductsDashboard').then((m) => ({ default: m.ProductsDashboard })));
const InventoryDashboard = lazy(() => import('../components/inventory/InventoryDashboard').then((m) => ({ default: m.InventoryDashboard })));
const ReturnsDashboard  = lazy(() => import('../components/returns/ReturnsDashboard').then((m) => ({ default: m.ReturnsDashboard })));
const FinancialDashboard = lazy(() => import('../components/financial/FinancialDashboard').then((m) => ({ default: m.FinancialDashboard })));
const CustomersDashboard = lazy(() => import('../components/customers/CustomersDashboard').then((m) => ({ default: m.CustomersDashboard })));

function TabSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

const TABS = [
  { label: 'Ventas',     icon: ShoppingCart },
  { label: 'Productos',  icon: Package },
  { label: 'Inventario', icon: Warehouse },
  { label: 'Retornos',   icon: RotateCcw },
  { label: 'Financiero', icon: DollarSign },
  { label: 'Clientes',   icon: Users },
];

function Reports() {
  const [filters, setFilters] = useState<ReportsFilters>(DEFAULT_REPORTS_FILTERS);

  function handleFilterChange(partial: Partial<ReportsFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="p-6 space-y-2">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>

      <ReportsFilterBar filters={filters} onChange={handleFilterChange} />

      <TabGroup>
        <TabList className="mt-2 mb-6">
          {TABS.map(({ label, icon: Icon }) => (
            <Tab key={label} icon={Icon}>{label}</Tab>
          ))}
        </TabList>

        <TabPanels>
          <TabPanel>
            <Suspense fallback={<TabSkeleton />}>
              <SalesDashboard filters={filters} />
            </Suspense>
          </TabPanel>

          <TabPanel>
            <Suspense fallback={<TabSkeleton />}>
              <ProductsDashboard filters={filters} />
            </Suspense>
          </TabPanel>

          <TabPanel>
            <Suspense fallback={<TabSkeleton />}>
              <InventoryDashboard filters={filters} />
            </Suspense>
          </TabPanel>

          <TabPanel>
            <Suspense fallback={<TabSkeleton />}>
              <ReturnsDashboard filters={filters} />
            </Suspense>
          </TabPanel>

          <TabPanel>
            <Suspense fallback={<TabSkeleton />}>
              <FinancialDashboard filters={filters} />
            </Suspense>
          </TabPanel>

          <TabPanel>
            <Suspense fallback={<TabSkeleton />}>
              <CustomersDashboard filters={filters} />
            </Suspense>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}

export default Reports;
