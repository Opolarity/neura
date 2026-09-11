import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '../shared/KpiCard';
import { filterOptionsService } from '../../services/reports.service';
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

  // El SP devuelve el id de la lista con la que valorizó (la pedida o la de
  // referencia): el subtítulo la nombra para que se vea que el número cambió
  // al elegir otra lista. Antes decía siempre "precio minorista".
  const priceLists = useQuery({
    queryKey: ['filter_price_lists'],
    queryFn: filterOptionsService.getPriceLists,
    staleTime: 1000 * 60 * 60,
  });
  const priceListName =
    priceLists.data?.find((pl) => pl.id === valuation?.price_list_id)?.name ?? 'minorista';

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
        subtitle={`stock × precio ${priceListName.toLowerCase()}`}
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
