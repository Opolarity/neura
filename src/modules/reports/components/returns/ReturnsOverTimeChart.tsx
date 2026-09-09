import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
} from '../shared/reportChartUtils';
import type { ReturnsOverTimeItem, Granularity } from '../../types/reports.types';

interface Props {
  data: ReturnsOverTimeItem[];
  loading: boolean;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
}

export function ReturnsOverTimeChart({ data, loading, granularity, onGranularityChange }: Props) {
  const chartData = data.map((d) => ({
    fecha: d.period,
    devoluciones: d.return_count,
    reembolso: d.total_refund_amount,
  }));

  return (
    <ReportCard
      title="Devoluciones en el tiempo"
      description="Los períodos sin retornos no aparecen en el eje."
      actions={
        <ReportSelect
          value={granularity}
          onValueChange={(value) => onGranularityChange(value as Granularity)}
          className="w-32"
          options={[
            { value: 'day', label: 'Diario' },
            { value: 'week', label: 'Semanal' },
            { value: 'month', label: 'Mensual' },
          ]}
        />
      }
    >
      {loading ? (
        <ChartLoading />
      ) : data.length === 0 ? (
        <EmptyReportState>Sin retornos en el periodo</EmptyReportState>
      ) : (
        <ChartContainer
          config={{
            devoluciones: { label: 'Devoluciones', color: reportChartColors.blue },
            reembolso: { label: 'Reembolso', color: reportChartColors.rose },
          }}
          className="h-56 w-full aspect-auto"
        >
          {/*
            Dos ejes: el conteo va en decenas y el reembolso en cientos de
            soles, así que en un eje único la serie de devoluciones quedaba
            pegada al piso y no se leía.
          */}
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} className={chartGrid} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} className={chartAxis} />
            <YAxis
              yAxisId="count"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              width={40}
              className={chartAxis}
            />
            <YAxis
              yAxisId="money"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={84}
              tickFormatter={formatCurrencyAxis}
              className={chartAxis}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    name === 'reembolso'
                      ? formatCurrencyAxis(value as number)
                      : formatNumber(value as number)
                  }
                />
              }
            />
            <Area
              yAxisId="count"
              dataKey="devoluciones"
              type="monotone"
              fill="var(--color-devoluciones)"
              fillOpacity={0.16}
              stroke="var(--color-devoluciones)"
              strokeWidth={2}
            />
            <Area
              yAxisId="money"
              dataKey="reembolso"
              type="monotone"
              fill="var(--color-reembolso)"
              fillOpacity={0.12}
              stroke="var(--color-reembolso)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ReportCard>
  );
}
