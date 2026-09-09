import { ReportCard, ChartLoading, EmptyReportState } from '../shared/ReportScaffold';
import type { MarginByProductItem } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  data: MarginByProductItem[];
  loading: boolean;
  /** Cuántos productos trae el SP. Va en el título: la tabla no es el total. */
  limit: number;
}

export function MarginByProductTable({ data, loading, limit }: Props) {
  return (
    <ReportCard title={`Top ${limit} productos por margen`}>
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo seleccionado</EmptyReportState>
      ) : (
        <div className="space-y-1">
          {data.map((p) => (
            <div key={p.product_id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b">
              <div className="min-w-0">
                <p className="truncate">{p.product_title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.units_sold} uds · {p.units_with_known_cost} con costo conocido
                </p>
              </div>
              <div className="text-right shrink-0">
                {p.margin !== null && p.margin_pct !== null ? (
                  <>
                    <p className="font-medium tabular-nums">{formatCurrency(p.margin)}</p>
                    <p className="text-xs text-muted-foreground">{p.margin_pct}%</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">N/D — sin costo cargado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ReportCard>
  );
}
