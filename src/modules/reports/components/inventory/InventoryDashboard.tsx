import { KpiCard } from '../shared/KpiCard';
import { DeadStockTable } from './DeadStockTable';
import { InventoryValuationKpis } from './InventoryValuationKpis';
import { LowStockDistributionChart } from './LowStockDistributionChart';
import { LowStockProductsTable } from './LowStockProductsTable';
import { StockByCategoryChart } from './StockByCategoryChart';
import { StockByTermChart } from './StockByTermChart';
import { StockFlowChart } from './StockFlowChart';
import { StockMovementTypesChart } from './StockMovementTypesChart';
import { StockRotationTable } from './StockRotationTable';
import type { InventoryDashboardState } from '../../hooks/useInventoryDashboard';

interface InventoryDashboardProps {
  dash: InventoryDashboardState;
}

export function InventoryDashboard({ dash }: InventoryDashboardProps) {
  const summary = dash.summary.data;

  return (
    <div className="space-y-6">
      {/* KPIs de conteo */}
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
          title={
            dash.threshold !== null
              ? `Stock bajo (≤${dash.threshold} uds)`
              : 'Stock bajo'
          }
          value={dash.threshold !== null ? summary?.low_stock_count ?? '—' : '—'}
          loading={dash.summary.isLoading}
          subtitle={
            dash.threshold !== null
              ? 'requieren reposición'
              : 'umbral no configurado (Configuración → Negocio)'
          }
        />
        <KpiCard
          title="Sin stock"
          value={summary?.zero_stock_count ?? '—'}
          loading={dash.summary.isLoading}
        />
      </div>

      {/* KPIs de valorización */}
      <InventoryValuationKpis
        valuation={dash.valuation.data}
        valuationLoading={dash.valuation.isLoading}
        deadStock={dash.deadStock.data}
        deadStockLoading={dash.deadStock.isLoading}
        deadStockDays={dash.deadStockDays}
      />

      {/* Flujo de inventario en el tiempo */}
      <StockFlowChart
        data={dash.stockFlow.data ?? []}
        loading={dash.stockFlow.isLoading}
        granularity={dash.flowGranularity}
        onGranularityChange={dash.setFlowGranularity}
      />

      {/* Distribución: categoría + talla */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StockByCategoryChart
          data={dash.byCategory.data ?? []}
          loading={dash.byCategory.isLoading}
        />
        <StockByTermChart
          data={dash.byTermGroup.data}
          loading={dash.byTermGroup.isLoading}
          onGroupChange={dash.setTermGroupId}
        />
      </div>

      {/* Movement types + Low stock side by side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StockMovementTypesChart
          data={dash.movementTypes.data ?? []}
          loading={dash.movementTypes.isLoading}
        />
        <LowStockDistributionChart
          data={dash.lowStockDistribution.data ?? []}
          loading={dash.lowStockDistribution.isLoading}
          threshold={dash.threshold}
        />
      </div>

      {/* T-269 · Bandeja de reposición: mismos SKUs que alimentan la alerta */}
      <LowStockProductsTable dash={dash} />

      {/* Stock muerto */}
      <DeadStockTable
        report={dash.deadStock.data}
        loading={dash.deadStock.isLoading}
        days={dash.deadStockDays}
        onDaysChange={dash.setDeadStockDays}
        page={dash.deadStockPage}
        pageSize={dash.deadStockPageSize}
        onPageChange={dash.setDeadStockPage}
      />

      {/* Rotation */}
      <StockRotationTable
        data={dash.rotation.data ?? []}
        loading={dash.rotation.isLoading}
      />
    </div>
  );
}
