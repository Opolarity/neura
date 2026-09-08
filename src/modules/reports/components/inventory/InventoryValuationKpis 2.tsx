import { KpiCard } from '../shared/KpiCard';
import type { DeadStockReport, InventoryValuation } from '../../types/reports.types';

interface Props {
  valuation: InventoryValuation | undefined;
  valuationLoading: boolean;
  deadStock: DeadStockReport | undefined;
  deadStockLoading: boolean;
  deadStockDays: number;
}

export function InventoryValuationKpis({
  valuation,
  valuationLoading,
  deadStock,
  deadStockLoading,
  deadStockDays,
}: Props) {
  const marginPct = valuation?.margin_pct;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Valor del inventario (costo)"
        value={valuation?.cost_value ?? '—'}
        prefix="S/ "
        loading={valuationLoading}
        subtitle="stock × costo de producto"
      />
      <KpiCard
        title="Valor potencial de venta"
        value={valuation?.retail_value ?? '—'}
        prefix="S/ "
        loading={valuationLoading}
        subtitle="stock × precio minorista"
      />
      <KpiCard
        title="Margen potencial"
        value={valuation?.potential_margin ?? '—'}
        prefix="S/ "
        loading={valuationLoading}
        subtitle={marginPct != null ? `${marginPct}% sobre venta` : undefined}
      />
      <KpiCard
        title="Valor inmovilizado"
        value={deadStock?.summary.total_cost_value ?? '—'}
        prefix="S/ "
        loading={deadStockLoading}
        subtitle={
          deadStock
            ? `${deadStock.summary.count.toLocaleString('es-PE')} SKUs sin salidas en ${deadStockDays} días`
            : undefined
        }
      />
    </div>
  );
}
