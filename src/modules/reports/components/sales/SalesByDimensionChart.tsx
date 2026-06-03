import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { SalesByDimensionItem, SalesDimension } from '../../types/reports.types';

interface DimensionBlock {
  data: SalesByDimensionItem[];
  loading: boolean;
}

interface Props {
  dimensions: Record<SalesDimension, DimensionBlock>;
}

const DIMENSION_LABELS: Record<SalesDimension, string> = {
  branch: 'Sucursal',
  sale_type: 'Canal de venta',
  payment_method: 'Método de pago',
  situation: 'Estado de pedido',
  state: 'Departamento',
  city: 'Ciudad',
  neighborhood: 'Distrito',
};

const ALL_DIMENSIONS: SalesDimension[] = [
  'branch', 'sale_type', 'payment_method', 'situation', 'state', 'city', 'neighborhood',
];

const TOP5_DIMENSIONS: SalesDimension[] = ['state', 'city', 'neighborhood'];

export function SalesByDimensionChart({ dimensions }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {ALL_DIMENSIONS.map((dim) => {
        const { data, loading } = dimensions[dim];
        const sliced = TOP5_DIMENSIONS.includes(dim)
          ? [...data]
              .filter((d) => d.label !== null && !/^sin /i.test(d.label))
              .sort((a, b) => b.total_revenue - a.total_revenue)
              .slice(0, 5)
          : data;
        const chartData = sliced.map((d) => ({
          dimension: d.label,
          ventas: d.total_revenue,
        }));

        return (
          <ReportCard key={dim} title={`Ventas por ${DIMENSION_LABELS[dim]}`}>
            {loading ? (
              <ChartLoading className="h-44" />
            ) : (
              <ChartContainer
                config={{ ventas: { label: 'Ventas', color: reportChartColors.blue } }}
                className="w-full aspect-auto"
                style={{ height: Math.max(chartData.length * 38, 140) }}
              >
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} className={chartGrid} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="dimension"
                    tickLine={false}
                    axisLine={false}
                    width={132}
                    className={chartAxis}
                  />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrencyAxis(value as number)} />} />
                  <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </ReportCard>
        );
      })}
    </div>
  );
}
