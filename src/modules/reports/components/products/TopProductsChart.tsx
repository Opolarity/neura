import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
  ReportCard,
  ReportSelect,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  reportChartColors,
  truncateLabel,
} from '../shared/reportChartUtils';
import type { TopProductItem, TopLimit, ProductsByCategoryItem } from '../../types/reports.types';

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

export function TopProductsChart({ data, loading, limit, onLimitChange, categoryId, categories, onCategoryChange }: Props) {
  const chartData = data.map((d) => ({
    producto: truncateLabel(d.product_title, 32),
    ingresos: d.total_revenue,
    unidades: d.total_quantity,
  }));

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
      ) : (
        <ChartContainer
          config={{ ingresos: { label: 'Ingresos', color: reportChartColors.blue } }}
          className="h-96 w-full aspect-auto"
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
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
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrencyAxis(value as number)} />} />
            <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
