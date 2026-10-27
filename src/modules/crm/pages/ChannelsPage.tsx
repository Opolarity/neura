import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/modules/reports/components/shared/KpiCard";
import { chartAxis, chartGrid } from "@/modules/reports/components/shared/reportChartUtils";
import { formatCurrency } from "@/shared/utils/currency";
import { parseLocalDate } from "@/shared/utils/date";
import { cn } from "@/shared/utils/utils";
import { ChannelName } from "../components/channels/ChannelName";
import { ChannelPageHeader } from "../components/channels/ChannelPageHeader";
import { useChannelMetrics } from "../hooks/useChannelMetrics";
import type { ChannelMetricsApi } from "../types/crm.types";
import { CHANNEL_COLOR, CHANNEL_LABEL, CHANNELS } from "../utils/channels";

const ChannelsPage = () => {
  const { preset, setPreset, loading, channels, company, points, products, granularity, reload } =
    useChannelMetrics();

  const totales = useMemo(() => {
    const sold = channels.reduce((a, c) => a + c.sold, 0);
    const collected = channels.reduce((a, c) => a + c.collected, 0);
    return {
      sold,
      collected,
      gap: sold - collected,
      orders: channels.reduce((a, c) => a + c.orders, 0),
      sharePct: company.sold > 0 ? (sold * 100) / company.sold : null,
    };
  }, [channels, company.sold]);

  // Recharts necesita una fila por período con una columna por canal.
  const serie = useMemo(() => {
    const porPeriodo = new Map<string, Record<string, number | string>>();
    for (const p of points) {
      const fila = porPeriodo.get(p.period) ?? { period: p.period };
      fila[p.code] = p.sold;
      porPeriodo.set(p.period, fila);
    }
    return [...porPeriodo.values()].sort((a, b) => String(a.period).localeCompare(String(b.period)));
  }, [points]);

  // El período es un día civil (YYYY-MM-DD): se arma como fecha local para no
  // correrlo un día al formatear.
  const etiquetaPeriodo = (v: string) =>
    parseLocalDate(v).toLocaleDateString(
      "es-PE",
      granularity === "month" ? { month: "short", year: "2-digit" } : { day: "2-digit", month: "short" }
    );

  return (
    <div className="flex flex-col gap-4">
      <ChannelPageHeader
        title="Rendimiento por canal"
        preset={preset}
        onPresetChange={setPreset}
        loading={loading}
        onReload={reload}
      />

      {/* Las dos cifras lado a lado y con la brecha explícita: mostrar una sola
          sería mentir en alguna dirección. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Vendido"
          value={formatCurrency(totales.sold)}
          subtitle={totales.sharePct !== null ? `${totales.sharePct.toFixed(1)} % del negocio` : undefined}
          loading={loading}
        />
        <KpiCard
          title="Cobrado"
          value={formatCurrency(totales.collected)}
          subtitle="Lo que efectivamente entró"
          loading={loading}
        />
        <KpiCard
          title="Falta cobrar"
          value={formatCurrency(totales.gap)}
          subtitle={
            totales.sold > 0 ? `${((totales.collected * 100) / totales.sold).toFixed(0)} % cobrado` : undefined
          }
          loading={loading}
        />
        <KpiCard title="Pedidos" value={totales.orders.toLocaleString("es-PE")} loading={loading} />
      </div>

      <Card className="flex min-h-0 flex-col overflow-hidden">
        <CardHeader className="!p-4">
          <CardTitle className="text-base font-semibold">Comparativa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Vendido</TableHead>
                <TableHead className="text-right">vs. período anterior</TableHead>
                <TableHead className="text-right">Cobrado</TableHead>
                <TableHead className="text-right">Cobertura</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Ticket mediano</TableHead>
                <TableHead className="text-right">Participación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((c) => (
                <Fila key={c.code} canal={c} />
              ))}
            </TableBody>
          </Table>
          <p className="px-4 pb-4 pt-3 text-[11px] leading-relaxed text-muted-foreground">
            <strong className="font-medium">Vendido</strong> es lo facturado;{" "}
            <strong className="font-medium">cobrado</strong>, lo que efectivamente entró. No se restan ni se
            dividen entre sí. El <strong className="font-medium">ticket mediano</strong> va en lugar del
            promedio a propósito: un solo pedido mayorista mueve el promedio del canal entero.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="!p-4">
          <CardTitle className="text-base font-semibold">Evolución de lo vendido</CardTitle>
        </CardHeader>
        <CardContent className="!px-4 !pb-4 pt-0">
          {serie.length === 0 ? (
            <Vacio texto="No hay ventas de estos canales en el período elegido." />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className={chartGrid} vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickFormatter={etiquetaPeriodo}
                    className={chartAxis}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    className={chartAxis}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    labelFormatter={etiquetaPeriodo}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {CHANNELS.map((ch, i) => (
                    <Bar
                      key={ch}
                      dataKey={ch}
                      name={CHANNEL_LABEL[ch]}
                      stackId="a"
                      fill={CHANNEL_COLOR[ch]}
                      radius={i === CHANNELS.length - 1 ? [3, 3, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="!p-4">
          <CardTitle className="text-base font-semibold">Lo más vendido en cada canal</CardTitle>
        </CardHeader>
        <CardContent className="!px-4 !pb-4 pt-0">
          {products.length === 0 ? (
            <Vacio texto="Todavía no hay productos vendidos por estos canales." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {channels.map((c) => {
                const suyos = products.filter((p) => p.code === c.code);
                return (
                  <div key={c.code} className="rounded-lg border p-3">
                    <p className="mb-2 text-xs">
                      <ChannelName code={c.code} />
                    </p>
                    {suyos.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin ventas.</p>
                    ) : (
                      <ol className="flex flex-col gap-1">
                        {suyos.map((p, i) => (
                          <li key={`${p.code}-${p.product_id}`} className="flex items-baseline gap-2 text-xs">
                            <span className="w-4 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                            <span className="min-w-0 flex-1 truncate">{p.name || `Producto ${p.product_id}`}</span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">{p.units} u.</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Fila = ({ canal }: { canal: ChannelMetricsApi }) => {
  const delta = canal.delta_sold_pct;
  const sube = delta !== null && delta > 0;

  return (
    <TableRow>
      <TableCell>
        <ChannelName code={canal.code} />
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(canal.sold)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {/* null y no 0: contra un período anterior en cero no existe la
            variación, y un 0 % se leería como "no cambió". */}
        {delta === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              sube ? "text-success" : "text-destructive"
            )}
          >
            {sube ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(canal.collected)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {canal.coverage_pct === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              "text-xs font-medium",
              canal.coverage_pct < 60 ? "text-warning-soft-foreground" : "text-muted-foreground"
            )}
          >
            {canal.coverage_pct}%
          </span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{canal.orders}</TableCell>
      <TableCell className="text-right tabular-nums">
        {canal.median_ticket === null ? "—" : formatCurrency(canal.median_ticket)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {canal.share_pct === null ? "—" : `${canal.share_pct}%`}
      </TableCell>
    </TableRow>
  );
};

const Vacio = ({ texto }: { texto: string }) => (
  <p className="py-8 text-center text-sm text-muted-foreground">{texto}</p>
);

export default ChannelsPage;
