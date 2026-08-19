import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import {
  chartAxis,
  chartGrid,
  formatCurrencyAxis,
  formatNumber,
  reportChartColors,
} from '../shared/reportChartUtils';
import type { GeoDistributionData } from '../../types/reports.types';

interface Props {
  data: GeoDistributionData | null;
  loading: boolean;
}

export function CustomersGeoChart({ data, loading }: Props) {
  const stateData = (data?.by_state ?? []).slice(0, 10).map((d) => ({
    label: d.state_name,
    compradores: d.unique_buyers,
    pedidos: d.order_count,
  }));

  const cities = (data?.by_city ?? []).slice(0, 10);
  const maxCityBuyers = Math.max(...cities.map((c) => c.unique_buyers), 1);

  return (
    <ReportCard title="Distribución geográfica de clientes">
      {loading ? (
        <ChartLoading />
      ) : stateData.length === 0 && cities.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo</EmptyReportState>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Por departamento (top 10)</p>
            <ChartContainer
              config={{ compradores: { label: 'Compradores', color: reportChartColors.blue } }}
              className="h-64 w-full aspect-auto"
            >
              <BarChart data={stateData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} className={chartGrid} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={136} className={chartAxis} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
                <Bar dataKey="compradores" fill="var(--color-compradores)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Por ciudad (top 10)</p>
            <div className="space-y-1.5">
              {cities.map((c) => (
                <div key={c.city_id} className="relative overflow-hidden rounded-md">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md"
                    style={{
                      width: `${(c.unique_buyers / maxCityBuyers) * 100}%`,
                      backgroundColor: `${reportChartColors.teal}1f`,
                    }}
                  />
                  <div className="relative flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
                    <span className="truncate font-medium">
                      {c.city_name}
                      <span className="ml-1.5 font-normal text-xs text-muted-foreground">{c.state_name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {formatNumber(c.unique_buyers)} compradores · {formatCurrencyAxis(c.total_revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ReportCard>
  );
}
