import { KpiCard } from '../shared/KpiCard';
import { LowStockTable } from './LowStockTable';
import { StockMovementTypesChart } from './StockMovementTypesChart';
import { StockRotationTable } from './StockRotationTable';
import { useInventoryDashboard } from '../../hooks/useInventoryDashboard';
import type { ReportsFilters } from '../../types/reports.types';

interface InventoryDashboardProps {
  filters: ReportsFilters;
}

export function InventoryDashboard({ filters }: InventoryDashboardProps) {
  const dash = useInventoryDashboard(filters);
  const summary = dash.summary.data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total SKUs"
          value={summary?.total_skus ?? '—'}
          loading={dash.summary.isLoading}
        />
        <KpiCard
          title="Unidades en stock"
          value={summary?.total_units ?? '—'}
          loading={dash.summary.isLoading}
        />
        <KpiCard
          title="Stock bajo (≤10 uds)"
          value={summary?.low_stock_count ?? '—'}
          loading={dash.summary.isLoading}
          subtitle="requieren reposición"
        />
        <KpiCard
          title="Sin stock"
          value={summary?.zero_stock_count ?? '—'}
          loading={dash.summary.isLoading}
        />
      </div>

      {/* Movement types + Low stock side by side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StockMovementTypesChart
          data={dash.movementTypes.data ?? []}
          loading={dash.movementTypes.isLoading}
        />
        <LowStockTable
          data={dash.lowStock.data?.data ?? []}
          loading={dash.lowStock.isLoading}
          total={dash.lowStock.data?.page.total ?? 0}
          page={dash.page}
          pageSize={dash.pageSize}
          onPageChange={dash.setPage}
        />
      </div>

      {/* Rotation */}
      <StockRotationTable
        data={dash.rotation.data ?? []}
        loading={dash.rotation.isLoading}
      />
    </div>
  );
}
