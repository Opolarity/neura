import { Grid, Col } from '@tremor/react';
import { KpiCard } from '../shared/KpiCard';
import { SalesOverTimeChart } from './SalesOverTimeChart';
import { SalesByDimensionChart } from './SalesByDimensionChart';
import { TopProductsTable } from './TopProductsTable';
import { useSalesDashboard } from '../../hooks/useSalesDashboard';
import type { ReportsFilters } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface SalesDashboardProps {
  filters: ReportsFilters;
}

export function SalesDashboard({ filters }: SalesDashboardProps) {
  const dash = useSalesDashboard(filters);
  const kpis = dash.kpis.data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Col>
          <KpiCard
            title="Ventas Totales"
            value={kpis ? formatCurrency(kpis.total_revenue) : '—'}
            loading={dash.kpis.isLoading}
            subtitle="en el periodo seleccionado"
          />
        </Col>
        <Col>
          <KpiCard
            title="N° de Pedidos"
            value={kpis?.order_count ?? '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Ticket Promedio"
            value={kpis ? formatCurrency(kpis.avg_ticket) : '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Descuentos Totales"
            value={kpis ? formatCurrency(kpis.total_discount) : '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
      </Grid>

      {/* Sales over time */}
      <SalesOverTimeChart
        data={dash.overTime.data ?? []}
        loading={dash.overTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* Sales by dimension */}
      <SalesByDimensionChart
        data={dash.byDimension.data ?? []}
        loading={dash.byDimension.isLoading}
        dimension={dash.dimension}
        onDimensionChange={dash.setDimension}
      />

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
