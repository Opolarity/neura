import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { FinancialByBranchItem } from '../../types/reports.types';

interface Props {
  data: FinancialByBranchItem[];
  loading: boolean;
}

/** Gemelo de "Por clase de movimiento", agrupado por la sucursal del movimiento. */
export function FinancialByBranchChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    sucursal: d.branch_name,
    ingresos: d.income,
    egresos: d.expense,
  }));

  return (
    <ReportCard
      info="Ingresos contra egresos de caja del período según la sucursal en la que se registró el movimiento. Misma fuente que el flujo de caja: los movimientos de las cuentas, clasificados por el signo del monto. Los movimientos sin sucursal van en Sin sucursal."
      title="Por sucursal"
      className="flex flex-col"
      contentClassName="flex-1 min-h-0"
    >
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin movimientos en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{
            ingresos: { label: 'Ingresos', color: reportChartColors.emerald },
            egresos: { label: 'Egresos', color: reportChartColors.rose },
          }}
          className="h-full min-h-56 w-full aspect-auto"
        >
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="sucursal" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatCurrencyAxis} className={chartAxis} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrencyAxis(value as number)} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="egresos" fill="var(--color-egresos)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
