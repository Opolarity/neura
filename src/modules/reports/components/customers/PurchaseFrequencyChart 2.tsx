import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartQualitativeSeries,
  formatCurrencyAxis,
  formatNumber,
} from '../shared/reportChartUtils';
import type { PurchaseFrequencyItem } from '../../types/reports.types';

interface Props {
  data: PurchaseFrequencyItem[];
  loading: boolean;
}

export function PurchaseFrequencyChart({ data, loading }: Props) {
  const total = data.reduce((sum, d) => sum + d.customer_count, 0);

  return (
    <ReportCard title="Frecuencia de compra">
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin compras en el periodo</EmptyReportState>
      ) : (
        <div className="space-y-4">
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {data.map((d, i) => (
              <div
                key={d.segment}
                style={{
                  width: `${total > 0 ? (d.customer_count / total) * 100 : 0}%`,
                  backgroundColor: chartQualitativeSeries[i % chartQualitativeSeries.length],
                }}
              />
            ))}
          </div>
          <div className="space-y-2.5">
            {data.map((d, i) => (
              <div key={d.segment} className="flex items-start justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: chartQualitativeSeries[i % chartQualitativeSeries.length] }}
                  />
                  {d.segment}
                </span>
                <span className="text-right text-muted-foreground">
                  <span className="font-medium text-foreground">{formatNumber(d.customer_count)}</span>
                  {' '}({total > 0 ? ((d.customer_count / total) * 100).toFixed(1) : '0'}%)
                  <span className="block text-xs">gasto prom. {formatCurrencyAxis(d.avg_revenue)}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(total)} compradores en el periodo, segmentados por cantidad de pedidos.
          </p>
        </div>
      )}
    </ReportCard>
  );
}
