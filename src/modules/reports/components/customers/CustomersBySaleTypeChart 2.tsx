import { Treemap } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
import type { CustomersBySaleTypeItem } from '../../types/reports.types';

interface Props {
  data: CustomersBySaleTypeItem[];
  loading: boolean;
}

const TOP_CHANNELS = 8;

interface TreemapNode {
  name: string;
  size: number;
  buyers: number;
  orders: number;
  fill: string;
}

// Celda propia del treemap: recharts pinta el default en negro si no se le
// pasa content, y el label solo entra cuando la celda tiene espacio.
function TreemapCell(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, fill } = props;
  const showLabel = width > 64 && height > 28;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} fillOpacity={0.85} stroke="hsl(var(--background))" strokeWidth={2} />
      {showLabel && (
        <text x={x + 8} y={y + 18} fill="hsl(var(--background))" fontSize={12} fontWeight={600}>
          {name}
        </text>
      )}
    </g>
  );
}

export function CustomersBySaleTypeChart({ data, loading }: Props) {
  const top = data.slice(0, TOP_CHANNELS);
  const rest = data.slice(TOP_CHANNELS);

  const nodes: TreemapNode[] = top.map((d, i) => ({
    name: d.sale_type_name,
    size: d.revenue,
    buyers: d.unique_buyers,
    orders: d.order_count,
    fill: chartQualitativeSeries[i % chartQualitativeSeries.length],
  }));
  if (rest.length > 0) {
    nodes.push({
      name: `Otros (${rest.length})`,
      size: rest.reduce((sum, d) => sum + d.revenue, 0),
      buyers: rest.reduce((sum, d) => sum + d.unique_buyers, 0),
      orders: rest.reduce((sum, d) => sum + d.order_count, 0),
      fill: chartQualitativeSeries[TOP_CHANNELS % chartQualitativeSeries.length],
    });
  }

  return (
    <ReportCard title="Clientes por canal de venta">
      {loading ? (
        <ChartLoading />
      ) : nodes.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo</EmptyReportState>
      ) : (
        <>
          <ChartContainer config={{ size: { label: 'Ingresos' } }} className="h-56 w-full aspect-auto">
            <Treemap
              data={nodes}
              dataKey="size"
              nameKey="name"
              isAnimationActive={false}
              content={<TreemapCell />}
            >
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_label, payload) =>
                      (payload?.[0]?.payload as TreemapNode | undefined)?.name ?? _label
                    }
                    formatter={(value, _name, _item, index, payload) => {
                      const row = payload as unknown as TreemapNode;
                      return (
                        <div className="flex w-full flex-col gap-1" key={index}>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Ingresos</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatCurrencyAxis(value as number)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Compradores</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatNumber(row.buyers)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">Pedidos</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatNumber(row.orders)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
            </Treemap>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {nodes.map((n) => (
              <span key={n.name} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.fill }} />
                {n.name} · {formatNumber(n.buyers)} compradores
              </span>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
