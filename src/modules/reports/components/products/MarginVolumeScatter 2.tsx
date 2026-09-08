import { useMemo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { MarginByProductItem } from '../../types/reports.types';

interface Props {
  data: MarginByProductItem[];
  loading: boolean;
}

interface ScatterPoint {
  producto: string;
  unidades: number;
  margen: number;
  ingresos: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function MarginVolumeScatter({ data, loading }: Props) {
  const { points, medianUnits, medianMargin } = useMemo(() => {
    // Sin costo conocido no hay margen que ubicar en el eje Y.
    const pts: ScatterPoint[] = data
      .filter((d) => d.margin_pct !== null && d.revenue !== null)
      .map((d) => ({
        producto: d.product_title,
        unidades: d.units_sold,
        margen: d.margin_pct as number,
        ingresos: d.revenue as number,
      }));
    return {
      points: pts,
      medianUnits: median(pts.map((p) => p.unidades)),
      medianMargin: median(pts.map((p) => p.margen)),
    };
  }, [data]);

  return (
    <ReportCard title="Margen vs volumen por producto">
      {loading ? (
        <ChartLoading className="h-80" />
      ) : points.length === 0 ? (
        <EmptyReportState>Sin productos con costo registrado en el periodo</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{ margen: { label: 'Margen', color: reportChartColors.violet } }}
            className="h-80 w-full aspect-auto"
          >
            <ScatterChart margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid className={chartGrid} />
              <XAxis
                type="number"
                dataKey="unidades"
                name="Unidades"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className={chartAxis}
                label={{
                  value: 'Unidades vendidas',
                  position: 'insideBottom',
                  offset: -4,
                  className: chartAxis,
                }}
              />
              <YAxis
                type="number"
                dataKey="margen"
                name="Margen"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={44}
                tickFormatter={(v) => `${v}%`}
                className={chartAxis}
              />
              <ZAxis type="number" dataKey="ingresos" range={[50, 420]} name="Ingresos" />
              <ReferenceLine
                x={medianUnits}
                stroke={reportChartColors.slate}
                strokeDasharray="4 4"
              />
              <ReferenceLine
                y={medianMargin}
                stroke={reportChartColors.slate}
                strokeDasharray="4 4"
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as ScatterPoint;
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                      <p className="mb-1 font-medium">{p.producto}</p>
                      <div className="grid gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Unidades</span>
                          <span className="font-mono tabular-nums">{formatNumber(p.unidades)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Margen</span>
                          <span className="font-mono tabular-nums">{p.margen.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Ingresos</span>
                          <span className="font-mono tabular-nums">{formatCurrencyAxis(p.ingresos)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={points}
                fill={reportChartColors.violet}
                fillOpacity={0.55}
                stroke={reportChartColors.violet}
              />
            </ScatterChart>
          </ChartContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Cada burbuja es un producto (tamaño = ingresos). Las líneas punteadas marcan las
            medianas: arriba-derecha <span className="font-medium">estrellas</span>, arriba-izquierda{' '}
            <span className="font-medium">premium de baja rotación</span>, abajo-derecha{' '}
            <span className="font-medium">volumen con poco margen</span>, abajo-izquierda{' '}
            <span className="font-medium">revisar</span>.
          </p>
        </>
      )}
    </ReportCard>
  );
}
