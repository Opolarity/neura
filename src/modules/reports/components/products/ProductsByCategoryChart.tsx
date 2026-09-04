import { useState } from 'react';
import { Treemap } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartQualitativeSeries,
  formatCurrencyAxis,
  formatNumber,
} from '../shared/reportChartUtils';
import { MultiCategoryNotice } from './MultiCategoryNotice';
import type { ProductsByCategoryItem, TopMetric } from '../../types/reports.types';

interface Props {
  data: ProductsByCategoryItem[];
  loading: boolean;
}

interface TreemapDatum {
  name: string;
  size: number;
  unidades: number;
  ingresos: number;
  productos: number;
  fill: string;
}

const METRIC_LABELS: Record<TopMetric, string> = {
  revenue: 'Ingresos',
  quantity: 'Unidades',
};

// Celda custom del treemap: rectángulo teñido + nombre y valor, ocultando el
// texto cuando el rectángulo es demasiado chico para que quepa sin encimarse.
function TreemapCell(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  fill?: string;
  metric?: TopMetric;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, size, fill, metric } = props;
  if (width <= 0 || height <= 0) return null;
  const showName = width > 64 && height > 30;
  const showValue = width > 64 && height > 48;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fill}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
      {showName && (
        <text
          x={x + 8}
          y={y + 18}
          fill="#fff"
          fontSize={12}
          fontWeight={500}
        >
          {name && name.length > width / 8 ? `${name.slice(0, Math.floor(width / 8))}…` : name}
        </text>
      )}
      {showValue && (
        <text x={x + 8} y={y + 34} fill="#fff" fontSize={11} opacity={0.85}>
          {metric === 'quantity'
            ? `${formatNumber(size ?? 0)} uds`
            : formatCurrencyAxis(size ?? 0)}
        </text>
      )}
    </g>
  );
}

export function ProductsByCategoryChart({ data, loading }: Props) {
  const [metric, setMetric] = useState<TopMetric>('revenue');

  const chartData: TreemapDatum[] = data
    .map((d, i) => ({
      name: d.category_name,
      size: metric === 'quantity' ? d.total_quantity : d.total_revenue,
      unidades: d.total_quantity,
      ingresos: d.total_revenue,
      productos: d.product_count,
      fill: chartQualitativeSeries[i % chartQualitativeSeries.length],
    }))
    .filter((d) => d.size > 0);

  return (
    <ReportCard
      title="Ventas por categoría"
      description={<MultiCategoryNotice />}
      actions={
        <ReportSelect
          value={metric}
          onValueChange={(v) => setMetric(v as TopMetric)}
          className="w-32"
          options={(Object.entries(METRIC_LABELS) as [TopMetric, string][]).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      }
    >
      {loading ? (
        <ChartLoading className="h-96" />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo seleccionado</EmptyReportState>
      ) : (
        <ChartContainer config={{}} className="h-96 w-full aspect-auto">
          <Treemap
            data={chartData}
            dataKey="size"
            nameKey="name"
            isAnimationActive={false}
            content={<TreemapCell metric={metric} />}
          >
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as TreemapDatum;
                return (
                  <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                    <p className="mb-1 font-medium">{p.name}</p>
                    <div className="grid gap-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Ingresos</span>
                        <span className="font-mono tabular-nums">{formatCurrencyAxis(p.ingresos)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Unidades</span>
                        <span className="font-mono tabular-nums">{formatNumber(p.unidades)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Productos distintos</span>
                        <span className="font-mono tabular-nums">{formatNumber(p.productos)}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </Treemap>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
