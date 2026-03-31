import { Grid, Col } from '@tremor/react';
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

const LOYALTY_LABEL: Record<string, string> = {
  sin_nivel: 'Sin nivel',
  L1: 'Nivel 1 (150–749 pts)',
  L2: 'Nivel 2 (750–1499 pts)',
  L3: 'Nivel 3 (1500–2999 pts)',
  L4: 'Nivel 4 (3000+ pts)',
};

export function CustomersDashboard({ filters }: CustomersDashboardProps) {
  const dash = useCustomersDashboard(filters);
  const kpis = dash.kpis.data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Col>
          <KpiCard
            title="Compradores únicos"
            value={kpis?.unique_buyers ?? '—'}
            loading={dash.kpis.isLoading}
            subtitle="en el periodo"
          />
        </Col>
        <Col>
          <KpiCard
            title="Ticket promedio"
            value={kpis ? formatCurrency(kpis.avg_ticket) : '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Con cuenta registrada"
            value={kpis?.with_account ?? '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Sin cuenta"
            value={kpis?.without_account ?? '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
      </Grid>

      {/* Loyalty + Top customers */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        <Col>
          <LoyaltyDistributionChart
            data={dash.kpis.data?.loyalty_distribution ?? []}
            loading={dash.kpis.isLoading}
            byLoyalty={dash.byLoyalty.data ?? []}
          />
        </Col>
        <Col>
          <TopCustomersTable
            data={dash.topCustomers.data ?? []}
            loading={dash.topCustomers.isLoading}
            limit={dash.topLimit}
            onLimitChange={dash.setTopLimit}
          />
        </Col>
      </Grid>

      {/* Geo distribution */}
      <CustomersGeoChart
        data={dash.geoDistribution.data ?? null}
        loading={dash.geoDistribution.isLoading}
      />
    </div>
  );
}
