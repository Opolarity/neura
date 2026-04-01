import { Grid, Col } from '@tremor/react';
import { KpiCard } from '../shared/KpiCard';
import { ReturnsOverTimeChart } from './ReturnsOverTimeChart';
import { TopReturnedProductsChart } from './TopReturnedProductsChart';
import { ReturnsByReasonChart } from './ReturnsByReasonChart';
import { useReturnsDashboard } from '../../hooks/useReturnsDashboard';
import type { ReportsFilters } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface ReturnsDashboardProps {
  filters: ReportsFilters;
}

export function ReturnsDashboard({ filters }: ReturnsDashboardProps) {
  const dash = useReturnsDashboard(filters);
  const kpis = dash.kpis.data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Col>
          <KpiCard
            title="Total devoluciones"
            value={kpis?.total_returns ?? '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Monto reembolsado"
            value={kpis ? formatCurrency(kpis.total_refund_amount) : '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Reembolso promedio"
            value={kpis ? formatCurrency(kpis.avg_refund_amount) : '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Tasa de devolución"
            value={kpis ? `${kpis.return_rate_pct}%` : '—'}
            loading={dash.kpis.isLoading}
            subtitle="sobre total de pedidos"
          />
        </Col>
      </Grid>

      {/* Over time */}
      <ReturnsOverTimeChart
        data={dash.overTime.data ?? []}
        loading={dash.overTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* Top returned + by reason side by side */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        <Col>
          <TopReturnedProductsChart
            data={dash.topProducts.data ?? []}
            loading={dash.topProducts.isLoading}
            limit={dash.topLimit}
            onLimitChange={dash.setTopLimit}
          />
        </Col>
        <Col>
          <ReturnsByReasonChart
            data={dash.byReason.data ?? []}
            loading={dash.byReason.isLoading}
          />
        </Col>
      </Grid>
    </div>
  );
}
