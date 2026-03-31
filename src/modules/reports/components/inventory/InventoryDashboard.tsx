import { Grid, Col } from '@tremor/react';
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
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Col>
          <KpiCard
            title="Total SKUs"
            value={summary?.total_skus ?? '—'}
            loading={dash.summary.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Unidades en stock"
            value={summary?.total_units ?? '—'}
            loading={dash.summary.isLoading}
          />
        </Col>
        <Col>
          <KpiCard
            title="Stock bajo (≤10 uds)"
            value={summary?.low_stock_count ?? '—'}
            loading={dash.summary.isLoading}
            subtitle="requieren reposición"
          />
        </Col>
        <Col>
          <KpiCard
            title="Sin stock"
            value={summary?.zero_stock_count ?? '—'}
            loading={dash.summary.isLoading}
          />
        </Col>
      </Grid>

      {/* Movement types + Low stock side by side */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        <Col>
          <StockMovementTypesChart
            data={dash.movementTypes.data ?? []}
            loading={dash.movementTypes.isLoading}
          />
        </Col>
        <Col>
          <LowStockTable
            data={dash.lowStock.data?.data ?? []}
            loading={dash.lowStock.isLoading}
            total={dash.lowStock.data?.page.total ?? 0}
            page={dash.page}
            pageSize={dash.pageSize}
            onPageChange={dash.setPage}
          />
        </Col>
      </Grid>

      {/* Rotation */}
      <StockRotationTable
        data={dash.rotation.data ?? []}
        loading={dash.rotation.isLoading}
      />
    </div>
  );
}
