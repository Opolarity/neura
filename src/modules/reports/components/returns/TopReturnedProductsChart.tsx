import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatNumber,
  reportChartColors,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { TopReturnedProduct } from '../../types/reports.types';

interface Props {
  data: TopReturnedProduct[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

const ROW_HEIGHT = 36;

/** Etiqueta del eje: nombre y, debajo en gris, la marca de inactivo. */
function ProductTick({ x, y, payload, byKey }: {
  x?: number;
  y?: number;
  payload?: { value: string };
  byKey: Map<string, { producto: string; inactivo: boolean }>;
}) {
  const item = payload ? byKey.get(payload.value) : undefined;
  if (!item || x === undefined || y === undefined) return null;
  return (
    <text x={x} y={y} textAnchor="end" className={chartAxis}>
      <tspan x={x} dy={item.inactivo ? -2 : 4}>{item.producto}</tspan>
      {item.inactivo && (
        <tspan x={x} dy={12} className="fill-muted-foreground text-[10px]">
          inactivo
        </tspan>
      )}
    </text>
  );
}

export function TopReturnedProductsChart({ data, loading, limit, onLimitChange }: Props) {
  // Los productos inactivos siguen contando (decisión de Diego); solo se
  // marca debajo del nombre para que se entienda por qué no aparecen en el
  // catálogo. La clave del eje es el id: dos productos pueden compartir título.
  const chartData = data.map((d) => ({
    key: String(d.product_id),
    producto: truncateLabel(d.product_title, 28),
    tituloCompleto: d.product_title,
    inactivo: d.product_is_active === false,
    devoluciones: d.return_count,
    unidades: d.total_quantity_returned,
  }));
  const byKey = new Map(chartData.map((d) => [d.key, d]));

  // Alto según filas: con 224 px fijos y Top 10, Recharts ocultaba una de cada
  // dos etiquetas del eje. 36 px por barra más la leyenda.
  const chartHeight = Math.max(160, chartData.length * ROW_HEIGHT + 32);

  return (
    <ReportCard
      info="Los productos con más retornos en el período, contando cada retorno en el que aparece. Solo cuenta la mercadería que vuelve: en un cambio, el producto que sale como reemplazo no suma. Un producto marcado (inactivo) ya no está en el catálogo pero sus devoluciones siguen contando."
      title="Productos más devueltos"
      description="Solo la mercadería que entra; el reemplazo que sale en un cambio no cuenta."
      actions={
        <ReportSelect
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
          className="w-24"
          options={[
            { value: '5', label: 'Top 5' },
            { value: '10', label: 'Top 10' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin productos devueltos en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{
            devoluciones: { label: 'Devoluciones', color: reportChartColors.blue },
            unidades: { label: 'Unidades', color: reportChartColors.sky },
          }}
          className="w-full aspect-auto"
          style={{ height: chartHeight }}
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} className={chartGrid} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="key"
              tickLine={false}
              axisLine={false}
              width={190}
              interval={0}
              tick={<ProductTick byKey={byKey} />}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                    if (!item) return null;
                    return item.tituloCompleto + (item.inactivo ? ' (inactivo)' : '');
                  }}
                  formatter={(value) => formatNumber(value as number)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="devoluciones" fill="var(--color-devoluciones)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
