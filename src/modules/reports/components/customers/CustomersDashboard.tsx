import { KpiCard } from '../shared/KpiCard';
import { TopCustomersTable } from './TopCustomersTable';
import { LoyaltyDistributionChart } from './LoyaltyDistributionChart';
import { CustomersGeoChart } from './CustomersGeoChart';
import { useCustomersDashboard } from '../../hooks/useCustomersDashboard';
import type { ReportsFilters } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface CustomersDashboardProps {
  filters: ReportsFilters;
}

export function CustomersDashboard({ filters }: CustomersDashboardProps) {
  const dash = useCustomersDashboard(filters);
  const kpis = dash.kpis.data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Compradores únicos"
          value={kpis?.unique_buyers ?? '—'}
          loading={dash.kpis.isLoading}
          subtitle="en el periodo"
        />
        <KpiCard
          title="Ticket promedio"
          value={kpis ? formatCurrency(kpis.avg_ticket) : '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Con cuenta registrada"
          value={kpis?.with_account ?? '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Sin cuenta"
          value={kpis?.without_account ?? '—'}
          loading={dash.kpis.isLoading}
        />
      </div>

      {/* Loyalty + Top customers */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LoyaltyDistributionChart
          data={dash.kpis.data?.loyalty_distribution ?? []}
          loading={dash.kpis.isLoading}
          byLoyalty={dash.byLoyalty.data ?? []}
        />
        <TopCustomersTable
          data={dash.topCustomers.data ?? []}
          loading={dash.topCustomers.isLoading}
          limit={dash.topLimit}
          onLimitChange={dash.setTopLimit}
        />
      </div>

      {/* Geo distribution */}
      <CustomersGeoChart
        data={dash.geoDistribution.data ?? null}
        loading={dash.geoDistribution.isLoading}
      />
    </div>
  );
}
