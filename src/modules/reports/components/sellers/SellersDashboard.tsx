import { KpiCard } from '../shared/KpiCard';
import { SellersRankingChart } from './SellersRankingChart';
import { SellersByBranchChart } from './SellersByBranchChart';
import { SellersOverTimeChart } from './SellersOverTimeChart';
import { SellersTable } from './SellersTable';
import { useSellersDashboard } from '../../hooks/useSellersDashboard';
import type { ReportsFilters } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface SellersDashboardProps {
  filters: ReportsFilters;
}

export function SellersDashboard({ filters }: SellersDashboardProps) {
  const dash = useSellersDashboard(filters);
  const kpis = dash.kpis.data;

  const withSellerPct =
    kpis && kpis.revenue_total > 0
      ? ((kpis.revenue_with_seller / kpis.revenue_total) * 100).toFixed(1)
      : null;
  const noSellerOrders = kpis ? kpis.orders_total - kpis.orders_with_seller : 0;

  return (
    <div className="space-y-6">
      {/* KPIs: todo sobre las ventas CON vendedor; el total va como referencia */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Vendedores con venta"
          value={kpis?.sellers_count ?? '—'}
          loading={dash.kpis.isLoading}
          subtitle="usuarios que registraron pedidos"
        />
        <KpiCard
          title="Ventas con vendedor"
          value={kpis ? formatCurrency(kpis.revenue_with_seller) : '—'}
          loading={dash.kpis.isLoading}
          subtitle={
            kpis && withSellerPct !== null
              ? `${withSellerPct}% de ${formatCurrency(kpis.revenue_total)} del período`
              : undefined
          }
        />
        <KpiCard
          title="Pedidos con vendedor"
          value={kpis?.orders_with_seller ?? '—'}
          loading={dash.kpis.isLoading}
          subtitle={kpis ? `${noSellerOrders.toLocaleString('es-PE')} sin vendedor (web / chatbot)` : undefined}
        />
        <KpiCard
          title="Ticket promedio"
          value={kpis ? formatCurrency(kpis.avg_ticket) : '—'}
          loading={dash.kpis.isLoading}
          subtitle="por pedido con vendedor"
        />
      </div>

      {/* Ranking + por sucursal */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SellersRankingChart
          data={dash.summary.data ?? []}
          loading={dash.summary.isLoading}
          limit={dash.topLimit}
          onLimitChange={dash.setTopLimit}
          metric={dash.topMetric}
          onMetricChange={dash.setTopMetric}
        />
        <SellersByBranchChart
          data={dash.byBranch.data ?? []}
          loading={dash.byBranch.isLoading}
        />
      </div>

      {/* En el tiempo */}
      <SellersOverTimeChart
        data={dash.overTime.data ?? []}
        loading={dash.overTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* Detalle */}
      <SellersTable data={dash.summary.data ?? []} loading={dash.summary.isLoading} />
    </div>
  );
}
