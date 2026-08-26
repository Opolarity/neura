import {
  Bar,
  BarChart,
  Cell,
  Label,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import type { SalesByDimensionItem, SalesDimension } from '../../types/reports.types';
import { ChartLoading, EmptyReportState, ReportCard } from '../shared/ReportScaffold';
import { chartAxis, chartQualitativeSeries, formatCurrencyAxis, truncateLabel } from '../shared/reportChartUtils';

interface DimensionBlock {
  data: SalesByDimensionItem[];
  loading: boolean;
}

// Solo las dimensiones que se grafican. Las geográficas (state/city/neighborhood)
// siguen existiendo en el RPC pero no se muestran aquí.
const CHART_DIMENSIONS = ['sale_type', 'payment_method', 'situation', 'branch'] as const;
type ChartDimension = (typeof CHART_DIMENSIONS)[number];

interface Props {
  dimensions: Record<ChartDimension, DimensionBlock>;
}

const DIMENSION_LABELS: Record<ChartDimension, string> = {
  branch: 'Sucursal',
  sale_type: 'Canal de venta',
  payment_method: 'Método de pago',
  situation: 'Estado de pedido',
};

// Un tipo de gráfico por dimensión, elegido por lo que se lee en cada una:
//  - dona    → participación sobre el total entre pocas categorías.
//  - radial  → comparación entre pocas categorías, con el arco como magnitud.
//  - barras  → ranking legible cuando importa el valor exacto de cada categoría.
//  - treemap → número de categorías abierto, se lee el peso relativo.
type ChartKind = 'donut' | 'radial' | 'bars' | 'treemap';

const DIMENSION_CHART: Record<ChartDimension, ChartKind> = {
  sale_type: 'donut',
  payment_method: 'radial',
  situation: 'bars',
  branch: 'treemap',
};

/** Máximo de porciones antes de agrupar la cola en "Otros", por tipo de gráfico. */
const MAX_SLICES: Record<ChartKind, number> = {
  donut: 8,
  // El radial apila un anillo por categoría: más de 5 y no se distinguen.
  radial: 5,
  bars: 8,
  treemap: 8,
};

interface Slice {
  name: string;
  ventas: number;
}

/** Ordena de mayor a menor y agrupa la cola para que el gráfico no sea confeti. */
function toSlices(data: SalesByDimensionItem[], max: number): Slice[] {
  const sorted = [...data]
    .filter((d) => d.total_revenue > 0)
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .map((d) => ({ name: d.label ?? 'Sin especificar', ventas: d.total_revenue }));

  if (sorted.length <= max) return sorted;

  const head = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1);
  return [
    ...head,
    { name: `Otros (${rest.length})`, ventas: rest.reduce((acc, d) => acc + d.ventas, 0) },
  ];
}

export function SalesByDimensionChart({ dimensions }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CHART_DIMENSIONS.map((dim) => {
        const { data, loading } = dimensions[dim];
        const kind = DIMENSION_CHART[dim];
        const slices = toSlices(data, MAX_SLICES[kind]);

        return (
          <ReportCard key={dim} title={`Ventas por ${DIMENSION_LABELS[dim]}`}>
            {loading ? (
              <ChartLoading className="h-64" />
            ) : slices.length === 0 ? (
              <EmptyReportState>Sin ventas en el periodo</EmptyReportState>
            ) : kind === 'donut' ? (
              <DimensionDonut slices={slices} />
            ) : kind === 'radial' ? (
              <DimensionRadial slices={slices} />
            ) : kind === 'bars' ? (
              <DimensionBars slices={slices} />
            ) : (
              <DimensionTreemap slices={slices} />
            )}
          </ReportCard>
        );
      })}
    </div>
  );
}

function DimensionDonut({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((acc, d) => acc + d.ventas, 0);

  return (
    <>
      <ChartContainer config={{}} className="h-52 w-full aspect-auto">
        <PieChart>
          <Pie data={slices} dataKey="ventas" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} strokeWidth={2}>
            {slices.map((_, i) => (
              <Cell key={i} fill={chartQualitativeSeries[i % chartQualitativeSeries.length]} />
            ))}
            <Label
              position="center"
              content={({ viewBox }) => {
                if (!viewBox || !('cx' in viewBox)) return null;
                const { cx, cy } = viewBox as { cx: number; cy: number };
                return (
                  <>
                    <tspan x={cx} y={cy - 6} className="fill-foreground text-sm font-semibold">
                      {formatCurrencyAxis(total)}
                    </tspan>
                    <tspan x={cx} y={cy + 12} className="fill-muted-foreground text-xs">
                      Total
                    </tspan>
                  </>
                );
              }}
            />
          </Pie>
          <Tooltip formatter={(v) => formatCurrencyAxis(v as number)} />
        </PieChart>
      </ChartContainer>
      <SliceLegend slices={slices} />
    </>
  );
}

/** Leyenda compartida por dona y radial: color, etiqueta y participación. */
function SliceLegend({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((acc, d) => acc + d.ventas, 0);

  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
      {slices.map((d, i) => (
        <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: chartQualitativeSeries[i % chartQualitativeSeries.length] }}
          />
          <span>{d.name}</span>
          <span className="font-medium text-foreground">
            {total > 0 ? `${((d.ventas / total) * 100).toFixed(1)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Anillos concéntricos, uno por categoría: el arco es la participación sobre el
 * total, así que se comparan magnitudes sin depender de leer ángulos de tarta.
 */
function DimensionRadial({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((acc, d) => acc + d.ventas, 0);

  return (
    <>
      <ChartContainer config={{}} className="h-52 w-full aspect-auto">
        <RadialBarChart
          data={slices}
          innerRadius="28%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          barSize={12}
        >
          {/* Fija el dominio al total para que el arco se lea como porcentaje. */}
          <PolarAngleAxis type="number" domain={[0, total]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="ventas" background cornerRadius={6} isAnimationActive={false}>
            {slices.map((_, i) => (
              <Cell key={i} fill={chartQualitativeSeries[i % chartQualitativeSeries.length]} />
            ))}
          </RadialBar>
          <Tooltip formatter={(v) => formatCurrencyAxis(v as number)} />
        </RadialBarChart>
      </ChartContainer>
      <SliceLegend slices={slices} />
    </>
  );
}

/** Barras horizontales: se lee el valor exacto y la etiqueta completa. */
function DimensionBars({ slices }: { slices: Slice[] }) {
  return (
    <ChartContainer config={{}} className="h-52 w-full aspect-auto">
      <BarChart data={slices} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
        <XAxis type="number" dataKey="ventas" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={96}
          axisLine={false}
          tickLine={false}
          className={chartAxis}
          tickFormatter={(v: string) => truncateLabel(v, 14)}
        />
        <Bar dataKey="ventas" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
          {slices.map((_, i) => (
            <Cell key={i} fill={chartQualitativeSeries[i % chartQualitativeSeries.length]} />
          ))}
          <LabelList
            dataKey="ventas"
            position="right"
            className="fill-muted-foreground text-[10px]"
            formatter={(v: number) => formatCurrencyAxis(v)}
          />
        </Bar>
        <Tooltip cursor={false} formatter={(v) => formatCurrencyAxis(v as number)} />
      </BarChart>
    </ChartContainer>
  );
}

interface TreemapCellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  depth?: number;
  name?: string;
  ventas?: number;
}

/** Bloque del treemap: solo escribe el texto si el rectángulo da el ancho. */
function TreemapCell({ x = 0, y = 0, width = 0, height = 0, index = 0, depth = 0, name, ventas }: TreemapCellProps) {
  // recharts también pinta el nodo raíz (depth 0), que ocupa todo el lienzo.
  if (depth === 0) return null;
  const fits = width > 70 && height > 34;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={chartQualitativeSeries[index % chartQualitativeSeries.length]}
        className="stroke-background"
        strokeWidth={2}
      />
      {fits && (
        <>
          <text x={x + 8} y={y + 18} className="fill-white text-xs font-medium">
            {truncateLabel(name ?? '', Math.floor(width / 8))}
          </text>
          <text x={x + 8} y={y + 32} className="fill-white/80 text-[10px]">
            {formatCurrencyAxis(ventas ?? 0)}
          </text>
        </>
      )}
    </g>
  );
}

function DimensionTreemap({ slices }: { slices: Slice[] }) {
  return (
    <ChartContainer config={{}} className="h-52 w-full aspect-auto">
      <Treemap
        data={slices}
        dataKey="ventas"
        nameKey="name"
        isAnimationActive={false}
        content={<TreemapCell />}
      >
        <Tooltip formatter={(v) => formatCurrencyAxis(v as number)} />
      </Treemap>
    </ChartContainer>
  );
}
