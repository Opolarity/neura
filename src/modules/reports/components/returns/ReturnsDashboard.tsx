import { KpiCard } from '../shared/KpiCard';
import { ReturnsOverTimeChart } from './ReturnsOverTimeChart';
import { TopReturnedProductsChart } from './TopReturnedProductsChart';
import { ReturnsByTypeChart } from './ReturnsByTypeChart';
import { ReturnsByTypeTable } from './ReturnsByTypeTable';
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
          subtitle={
            kpis ? `${kpis.total_units_returned.toLocaleString('es-PE')} unidades devueltas` : undefined
          }
        />
        <KpiCard
          title="Monto reembolsado"
          value={kpis ? formatCurrency(kpis.total_refund_amount) : '—'}
          loading={dash.kpis.isLoading}
          subtitle={kpis ? `${kpis.refunded_count} con movimiento registrado` : undefined}
        />
        <KpiCard
          title="Reembolso promedio"
          value={kpis ? formatCurrency(kpis.avg_refund_amount) : '—'}
          loading={dash.kpis.isLoading}
          subtitle="por retorno con reembolso"
        />
        <KpiCard
          title="Tasa de devolución"
          value={kpis ? `${kpis.return_rate_pct}%` : '—'}
          loading={dash.kpis.isLoading}
          subtitle={
            kpis ? `sobre ${kpis.order_count.toLocaleString('es-PE')} pedidos del período` : undefined
          }
        />
      </div>

      {/* Over time */}
      <ReturnsOverTimeChart
        data={dash.overTime.data ?? []}
        loading={dash.overTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* Detalle por tipo (tabla) + dona por tipo, lado a lado */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReturnsByTypeTable
          data={dash.byType.data ?? []}
          loading={dash.byType.isLoading}
        />
        <ReturnsByTypeChart
          data={dash.byType.data ?? []}
          loading={dash.byType.isLoading}
        />
      </div>

      {/* Top devueltos a todo el ancho: con Top 10 necesita el alto */}
      <TopReturnedProductsChart
        data={dash.topProducts.data ?? []}
        loading={dash.topProducts.isLoading}
        limit={dash.topLimit}
        onLimitChange={dash.setTopLimit}
      />
    </div>
  );
}
