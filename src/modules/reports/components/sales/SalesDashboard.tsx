import { KpiCard } from '../shared/KpiCard';
import { SalesOverTimeChart } from './SalesOverTimeChart';
import { SalesByDimensionChart } from './SalesByDimensionChart';
import { SalesHeatmap } from './SalesHeatmap';
import { TopProductsTable } from './TopProductsTable';
import { useSalesDashboard } from '../../hooks/useSalesDashboard';
import type { ReportsFilters, SalesByDimensionItem, SalesDimension } from '../../types/reports.types';
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
      { data: (query.data as SalesByDimensionItem[]) ?? [], loading: query.isLoading },
    ]),
  ) as Record<SalesDimension, { data: SalesByDimensionItem[]; loading: boolean }>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Ventas Netas"
          value={kpis ? formatCurrency(kpis.total_revenue) : '—'}
          loading={dash.kpis.isLoading}
          subtitle={
            kpis
              ? `Bruto: ${formatCurrency(kpis.gross_revenue)} · Dev: -${formatCurrency(kpis.total_refunds)}`
              : 'en el periodo seleccionado'
          }
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

      {/* Sales over time */}
      <SalesOverTimeChart
        data={dash.overTime.data ?? []}
        loading={dash.overTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* Mapa de calor por departamento / provincia */}
      <SalesHeatmap filters={filters} />

      {/* Sales by dimension — un bloque por dimensión */}
      <SalesByDimensionChart dimensions={dimensions} />

      {/* Top products */}
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
