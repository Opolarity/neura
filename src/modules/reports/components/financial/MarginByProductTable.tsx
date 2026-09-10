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
    <ReportCard
      info={`Los ${limit} productos con mayor margen bruto del período: ingresos por línea de producto menos costo de la variación, por las unidades vendidas netas de devoluciones. Solo se valorizan las unidades cuyo costo en el catálogo es mayor a cero; un producto sin ninguna unidad con costo figura como Sin costo cargado. Es un top, no el total: el Excel trae todos los productos.`}
      title={`Top ${limit} productos por margen`}
    >
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
                  {p.units_sold} uds vendidas
                  {p.units_with_known_cost < p.units_sold &&
                    ` · ${p.units_sold - p.units_with_known_cost} sin costo`}
                </p>
              </div>
              <div className="text-right shrink-0">
                {p.margin !== null ? (
                  <>
                    <p className="font-medium tabular-nums">{formatCurrency(p.margin)}</p>
                    {/* margin_pct es null cuando la venta fue S/ 0 (regalo, canje):
                        hay costo y margen, pero no un porcentaje sobre venta. */}
                    <p className="text-xs text-muted-foreground">
                      {p.margin_pct !== null ? `${p.margin_pct}%` : 'sin % (venta en 0)'}
                    </p>
                  </>
                ) : (
                  // Ninguna unidad vendida de este producto tiene un costo mayor a
                  // cero en el catálogo, así que no hay margen que calcular.
                  <p className="text-xs text-muted-foreground">Sin costo cargado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ReportCard>
  );
}
