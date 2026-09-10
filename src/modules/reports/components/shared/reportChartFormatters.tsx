import type { ReactNode } from 'react';
import { formatCurrencyAxis } from './reportChartUtils';

/**
 * Fila del tooltip para series en soles: nombre de la serie a la izquierda y
 * monto a la derecha. ChartTooltipContent, cuando recibe `formatter`, deja de
 * pintar el nombre de la serie: por eso el formatter lo devuelve él mismo.
 */
export function currencyTooltipRow(labels: Record<string, string>) {
  return (value: unknown, name: unknown): ReactNode => (
    <div className="flex flex-1 items-center justify-between gap-4 leading-none">
      <span className="text-muted-foreground">{labels[String(name)] ?? String(name)}</span>
      <span className="font-mono font-medium tabular-nums text-foreground">
        {formatCurrencyAxis(value as number)}
      </span>
    </div>
  );
}
