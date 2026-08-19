import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
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
} from '../shared/reportChartUtils';
import type { Granularity, StockFlowItem } from '../../types/reports.types';

interface Props {
  data: StockFlowItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

const GRANULARITY_OPTIONS: Array<{ value: Granularity; label: string }> = [
  { value: 'day', label: 'Diario' },
  { value: 'week', label: 'Semanal' },
];

export function StockFlowChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    fecha: d.period,
    entradas: d.inflow,
    salidas: d.outflow,
    neto: d.net,
  }));

  return (
    <ReportCard
      title="Flujo de inventario (entradas vs salidas)"
      actions={
        <ReportSelect
          value={granularity}
          onValueChange={onGranularityChange}
          options={GRANULARITY_OPTIONS}
          className="w-32"
        />
      }
    >
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin movimientos en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{
            entradas: { label: 'Entradas', color: reportChartColors.emerald },
            salidas: { label: 'Salidas', color: reportChartColors.rose },
            neto: { label: 'Neto', color: reportChartColors.blue },
          }}
          className="h-64 w-full aspect-auto"
        >
          <ComposedChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="entradas" fill="var(--color-entradas)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="salidas" fill="var(--color-salidas)" radius={[4, 4, 0, 0]} />
            <Line dataKey="neto" type="monotone" stroke="var(--color-neto)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
