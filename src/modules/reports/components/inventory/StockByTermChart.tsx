import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  chartAxis,
  chartGrid,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { StockByTermGroup } from '../../types/reports.types';

interface Props {
  data: StockByTermGroup | undefined;
  loading: boolean;
  onGroupChange: (groupId: number) => void;
}

export function StockByTermChart({ data, loading, onGroupChange }: Props) {
  const chartData = (data?.data ?? []).map((d) => ({
    termino: d.term,
    unidades: d.units,
    skus: d.skus,
  }));
  const groups = data?.groups ?? [];

  return (
    <ReportCard
      title="Stock por talla"
      actions={
        groups.length > 1 ? (
          <Select
            value={data?.group_id != null ? String(data.group_id) : undefined}
            onValueChange={(v) => onGroupChange(Number(v))}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : undefined
      }
    >
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin stock con tallas registradas</EmptyReportState>
      ) : (
        <ChartContainer
          config={{
            unidades: { label: 'Unidades', color: reportChartColors.indigo },
            skus: { label: 'SKUs', color: reportChartColors.sky },
          }}
          className="h-52 w-full aspect-auto"
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="termino" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
            <Bar dataKey="unidades" fill="var(--color-unidades)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="skus" fill="var(--color-skus)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
