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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total devoluciones"
          value={kpis?.total_returns ?? '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Monto reembolsado"
          value={kpis ? formatCurrency(kpis.total_refund_amount) : '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Reembolso promedio"
          value={kpis ? formatCurrency(kpis.avg_refund_amount) : '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Tasa de devolución"
          value={kpis ? `${kpis.return_rate_pct}%` : '—'}
          loading={dash.kpis.isLoading}
          subtitle="sobre total de pedidos"
        />
      </div>

      {/* Over time */}
      <ReturnsOverTimeChart
        data={dash.overTime.data ?? []}
        loading={dash.overTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* Top returned + by reason side by side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopReturnedProductsChart
          data={dash.topProducts.data ?? []}
          loading={dash.topProducts.isLoading}
          limit={dash.topLimit}
          onLimitChange={dash.setTopLimit}
        />
        <ReturnsByReasonChart
          data={dash.byReason.data ?? []}
          loading={dash.byReason.isLoading}
        />
      </div>
    </div>
  );
}
