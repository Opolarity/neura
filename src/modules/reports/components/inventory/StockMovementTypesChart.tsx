import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { StockMovementTypeItem } from '../../types/reports.types';

interface Props {
  data: StockMovementTypeItem[];
  loading: boolean;
}

export function StockMovementTypesChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    tipo: d.type_name,
    movimientos: d.movement_count,
    unidades: d.total_quantity,
  }));

  return (
    <ReportCard title="Tipos de movimiento de inventario">
      {loading ? (
        <ChartLoading />
      ) : (
        <ChartContainer
          config={{
            movimientos: { label: 'Movimientos', color: reportChartColors.blue },
            unidades: { label: 'Unidades totales', color: reportChartColors.sky },
          }}
          className="h-56 w-full aspect-auto"
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="tipo" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
            <Bar dataKey="movimientos" fill="var(--color-movimientos)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unidades" fill="var(--color-unidades)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
