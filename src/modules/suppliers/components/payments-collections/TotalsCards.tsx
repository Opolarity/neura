import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/shared/utils/currency";

interface TotalsCardsProps {
  /** En orden de lectura: lo exigible, lo pagado y, al final, lo que falta. */
  items: Array<{ label: string; value: number }>;
}

/**
 * Los totales de lo filtrado en tarjetas, encima de la tabla (2026-10-19): el
 * rótulo pequeño y la cifra grande, como las de Productos de Overtake.
 */
export const TotalsCards = ({ items }: TotalsCardsProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    {items.map((item) => (
      <Card key={item.label}>
        <CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-4 text-3xl font-bold tabular-nums">{formatCurrency(item.value)}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
