import { KpiCard } from '../shared/KpiCard';
import { SalesOverTimeChart } from './SalesOverTimeChart';
import { SalesByDimensionChart } from './SalesByDimensionChart';
import { TopProductsTable } from './TopProductsTable';
import { useSalesDashboard } from '../../hooks/useSalesDashboard';
import type { ReportsFilters, SalesDimension } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface SalesDashboardProps {
  filters: ReportsFilters;
}

export function SalesDashboard({ filters }: SalesDashboardProps) {
  const dash = useSalesDashboard(filters);
  const kpis = dash.kpis.data;

  const dimensions = Object.fromEntries(
    Object.entries(dash.byDimensionQueries).map(([dim, query]) => [
      dim,
      { data: (query.data as any[]) ?? [], loading: query.isLoading },
    ]),
  ) as Record<SalesDimension, { data: any[]; loading: boolean }>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ventas Totales"
          value={kpis ? formatCurrency(kpis.total_revenue) : '—'}
          loading={dash.kpis.isLoading}
          subtitle="en el periodo seleccionado"
        />
        <KpiCard
          title="N° de Pedidos"
          value={kpis?.order_count ?? '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Ticket Promedio"
          value={kpis ? formatCurrency(kpis.avg_ticket) : '—'}
          loading={dash.kpis.isLoading}
        />
        <KpiCard
          title="Descuentos Totales"
          value={kpis ? formatCurrency(kpis.total_discount) : '—'}
          loading={dash.kpis.isLoading}
        />
      </div>

      <SalesOverTimeChart
        data={dash.overTime.data ?? []}
        loading={dash.overTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      <SalesByDimensionChart dimensions={dimensions} />

      <TopProductsTable
        data={dash.topProducts.data ?? []}
        loading={dash.topProducts.isLoading}
        metric={dash.topMetric}
        limit={dash.topLimit}
        onMetricChange={dash.setTopMetric}
        onLimitChange={dash.setTopLimit}
      />
    </div>
  );
}
