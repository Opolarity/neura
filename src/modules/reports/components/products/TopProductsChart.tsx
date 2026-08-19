import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { TopProductItem, TopLimit, TopMetric, ProductsByCategoryItem } from '../../types/reports.types';

interface Props {
  data: TopProductItem[];
  loading: boolean;
  limit: TopLimit;
  onLimitChange: (l: TopLimit) => void;
  categoryId: number | null;
  categories: ProductsByCategoryItem[];
  onCategoryChange: (id: number | null) => void;
}

const ALL = '__all__';

const METRIC_LABELS: Record<TopMetric, string> = {
  revenue: 'Ingresos',
  quantity: 'Unidades',
};

// El podio se destaca con colores propios; del 4.º en adelante todas las
// barras comparten el azul base para no convertir el ranking en un arcoíris.
const PODIUM_COLORS = [reportChartColors.violet, reportChartColors.indigo, reportChartColors.sky];

export function TopProductsChart({ data, loading, limit, onLimitChange, categoryId, categories, onCategoryChange }: Props) {
  const [metric, setMetric] = useState<TopMetric>('revenue');

  const sorted = [...data].sort((a, b) =>
    metric === 'quantity'
      ? b.total_quantity - a.total_quantity
      : b.total_revenue - a.total_revenue,
  );

  const chartData = sorted.map((d) => ({
    producto: truncateLabel(d.product_title, 32),
    valor: metric === 'quantity' ? d.total_quantity : d.total_revenue,
    ingresos: d.total_revenue,
    unidades: d.total_quantity,
  }));

  const formatValue = metric === 'quantity' ? formatNumber : formatCurrencyAxis;

  return (
    <ReportCard
      title="Productos más vendidos"
      actions={
        <div className="flex flex-wrap gap-2">
          <Select
            value={categoryId?.toString() ?? ALL}
            onValueChange={(v) => onCategoryChange(v === ALL ? null : Number(v))}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.category_id ?? 'null'} value={c.category_id?.toString() ?? 'null'}>
                {c.category_name}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
          <ReportSelect
            value={metric}
            onValueChange={(v) => setMetric(v as TopMetric)}
            className="w-28"
            options={(Object.entries(METRIC_LABELS) as [TopMetric, string][]).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <ReportSelect
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(Number(value) as TopLimit)}
            className="w-24"
            options={[
              { value: '5', label: 'Top 5' },
              { value: '10', label: 'Top 10' },
              { value: '20', label: 'Top 20' },
            ]}
          />
        </div>
      }
    >
      {loading ? (
        <ChartLoading className="h-96" />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin ventas en el periodo seleccionado</EmptyReportState>
      ) : (
        <ChartContainer
          config={{ valor: { label: METRIC_LABELS[metric], color: reportChartColors.blue } }}
          className="h-96 w-full aspect-auto"
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 56 }}>
            <CartesianGrid horizontal={false} className={chartGrid} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="producto"
              tickLine={false}
              axisLine={false}
              width={184}
              className={chartAxis}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(_value, _name, _item, _index, payload) => {
                    const row = payload as unknown as { ingresos: number; unidades: number };
                    return (
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex flex-1 items-center justify-between leading-none">
                          <span className="text-muted-foreground">Ingresos</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formatCurrencyAxis(row.ingresos)}
                          </span>
                        </div>
                        <div className="flex flex-1 items-center justify-between leading-none">
                          <span className="text-muted-foreground">Unidades vendidas</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {row.unidades.toLocaleString('es-PE')}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="valor" fill="var(--color-valor)" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.producto}
                  fill={index < PODIUM_COLORS.length ? PODIUM_COLORS[index] : reportChartColors.blue}
                />
              ))}
              <LabelList
                dataKey="valor"
                position="right"
                formatter={(value: number) => formatValue(value)}
                className="fill-muted-foreground text-[11px] tabular-nums"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
