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
import type { FinancialByPaymentItem } from '../../types/reports.types';

interface Props {
  data: FinancialByPaymentItem[];
  loading: boolean;
}

/**
 * Antes era una torta que solo graficaba `income`. El SP siempre devolvió
 * también `expense`, así que la mitad del dato se descartaba: un método usado
 * solo para pagar salía como una porción en cero. Barras agrupadas, igual que
 * "Por clase de movimiento", que es su gemelo de al lado y siempre mostró las
 * dos series.
 */
export function FinancialByPaymentChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    metodo: d.payment_method_name,
    ingresos: d.income,
    egresos: d.expense,
  }));

  return (
    <ReportCard title="Ingresos y egresos por método de pago" className="flex flex-col" contentClassName="flex-1 min-h-0">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo</EmptyReportState>
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
            <XAxis dataKey="metodo" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
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
