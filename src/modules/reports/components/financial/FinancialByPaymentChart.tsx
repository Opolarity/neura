import { Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ChartLoading,
  EmptyReportState,
  ReportCard,
} from '../shared/ReportScaffold';
import { formatCurrencyAxis } from '../shared/reportChartUtils';
import type { FinancialByPaymentItem } from '../../types/reports.types';

interface Props {
  data: FinancialByPaymentItem[];
  loading: boolean;
}

export function FinancialByPaymentChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    name: d.payment_method_name,
    value: d.income,
  }));
  // Serie cualitativa armada con los tokens de color de `index.css`, alternando
  // familias de tono para que dos porciones contiguas nunca queden en el mismo
  // color. Al ser tokens, en `.dark` se aclaran solos (los `-soft-foreground`
  // invierten su luminosidad) sin declarar nada aparte.
  // Ojo al reordenar: en `.dark` los pares primary/ring y
  // muted-foreground/pending-foreground colapsan al mismo valor, por eso van
  // separados varias posiciones y no contiguos.
  const colors = [
    'hsl(var(--success))', // verde
    'hsl(var(--primary))', // morado
    'hsl(var(--warning))', // ámbar
    'hsl(var(--info))', // azul
    'hsl(var(--destructive))', // rojo
    'hsl(var(--pending-foreground))', // gris oscuro
    'hsl(var(--success-soft-foreground))', // verde oscuro
    'hsl(var(--ring))', // morado claro
    'hsl(var(--warning-soft-foreground))', // ámbar oscuro
    'hsl(var(--muted-foreground))', // gris medio
    'hsl(var(--destructive-soft-foreground))', // rojo oscuro
  ];

  return (
    <ReportCard title="Ingresos por método de pago">
      {loading ? (
        <ChartLoading />
      ) : chartData.length === 0 ? (
        <EmptyReportState>Sin datos en el periodo</EmptyReportState>
      ) : (
        <>
          <ChartContainer
            config={{ value: { label: 'Ingresos', color: 'hsl(var(--success))' } }}
            className="h-52 w-full aspect-auto"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => formatCurrencyAxis(value as number)} />} />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap gap-2">
            {chartData.map((entry, index) => (
              <span key={entry.name} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                {entry.name}
              </span>
            ))}
          </div>
        </>
      )}
    </ReportCard>
  );
}
