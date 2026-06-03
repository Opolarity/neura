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

  const cityData = (data?.by_city ?? []).slice(0, 10).map((d) => ({
    label: d.city_name,
    compradores: d.unique_buyers,
    pedidos: d.order_count,
  }));

  return (
    <ReportCard title="Distribución geográfica de clientes">
      {loading ? (
        <ChartLoading />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Por departamento (top 10)</p>
            <GeoBarChart data={stateData} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Por ciudad (top 10)</p>
            <GeoBarChart data={cityData} />
          </div>
        </div>
      )}
    </ReportCard>
  );
}

function GeoBarChart({ data }: { data: Array<{ label: string; compradores: number; pedidos: number }> }) {
  return (
    <ChartContainer
      config={{ compradores: { label: 'Compradores', color: reportChartColors.blue } }}
      className="h-56 w-full aspect-auto"
    >
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} className={chartGrid} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={136} className={chartAxis} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
        <Bar dataKey="compradores" fill="var(--color-compradores)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
