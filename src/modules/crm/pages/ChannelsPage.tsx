import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/utils";
import {
  RANGE_LABELS,
  useChannelMetrics,
  type RangePreset,
} from "../hooks/useChannelMetrics";
import type { ChannelMetricsApi } from "../types/crm.types";

const soles = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// Un color por canal, estable en toda la pantalla: el mismo morado en la tabla,
// en el gráfico y en el top de productos.
const COLOR: Record<string, string> = {
  WA: "hsl(var(--success))",
  IG: "hsl(var(--primary))",
  FB: "hsl(var(--info))",
};

const ChannelsPage = () => {
  const {
    preset,
    setPreset,
    loading,
    channels,
    company,
    points,
    products,
    granularity,
    reload,
  } = useChannelMetrics();

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
    return [...porPeriodo.values()].sort((a, b) =>
      String(a.period).localeCompare(String(b.period))
    );
  }, [points]);

  const etiquetaPeriodo = (v: string) => {
    const d = new Date(`${v}T00:00:00`);
    if (granularity === "month") {
      return d.toLocaleDateString("es-PE", { month: "short", year: "2-digit" });
    }
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold leading-tight">Rendimiento por canal</h1>
          <p className="text-sm text-muted-foreground">
            WhatsApp, Instagram y Facebook: cuánto vende cada uno y cuánto se cobró.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABELS) as RangePreset[]).map((k) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {RANGE_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={reload}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Las dos cifras, lado a lado y con la brecha explícita. Mostrar una
          sola sería mentir en alguna dirección. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          titulo="Vendido"
          valor={soles(totales.sold)}
          nota={
            totales.sharePct !== null
              ? `${totales.sharePct.toFixed(1)} % de la empresa`
              : undefined
          }
          loading={loading}
        />
        <Kpi
          titulo="Cobrado"
          valor={soles(totales.collected)}
          nota="Es lo que mide el reporte de Ventas"
          loading={loading}
        />
        <Kpi
          titulo="Falta cobrar"
          valor={soles(totales.gap)}
          nota={
            totales.sold > 0
              ? `${((totales.collected * 100) / totales.sold).toFixed(0)} % cobrado`
              : undefined
          }
          alerta={totales.gap > 0}
          loading={loading}
        />
        <Kpi titulo="Pedidos" valor={totales.orders.toLocaleString("es-PE")} loading={loading} />
      </div>

      {/* Comparativa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Comparativa</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Canal</th>
                  <th className="pb-2 pr-3 text-right font-medium">Vendido</th>
                  <th className="pb-2 pr-3 text-right font-medium">vs. período anterior</th>
                  <th className="pb-2 pr-3 text-right font-medium">Cobrado</th>
                  <th className="pb-2 pr-3 text-right font-medium">Cobertura</th>
                  <th className="pb-2 pr-3 text-right font-medium">Pedidos</th>
                  <th className="pb-2 pr-3 text-right font-medium">Ticket mediano</th>
                  <th className="pb-2 text-right font-medium">Participación</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <Fila key={c.code} canal={c} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            <strong className="font-medium">Vendido</strong> es lo facturado;{" "}
            <strong className="font-medium">cobrado</strong> es lo que efectivamente
            entró y es como el ERP mide sus reportes de ventas. No se restan ni se
            dividen entre sí. El <strong className="font-medium">ticket mediano</strong>{" "}
            va en lugar del promedio a propósito: un solo pedido mayorista mueve el
            promedio del canal entero y esconde cómo son los pedidos típicos.
          </p>
        </CardContent>
      </Card>

      {/* Evolución */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Evolución de lo vendido
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {serie.length === 0 ? (
            <Vacio texto="No hay ventas de estos canales en el período elegido." />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickFormatter={etiquetaPeriodo}
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    formatter={(v: number) => soles(v)}
                    labelFormatter={etiquetaPeriodo}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="WA" name="WhatsApp" stackId="a" fill={COLOR.WA} />
                  <Bar dataKey="IG" name="Instagram" stackId="a" fill={COLOR.IG} />
                  <Bar dataKey="FB" name="Facebook" stackId="a" fill={COLOR.FB} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top de productos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Lo más vendido en cada canal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {products.length === 0 ? (
            <Vacio texto="Todavía no hay productos vendidos por estos canales." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {channels.map((c) => {
                const suyos = products.filter((p) => p.code === c.code);
                return (
                  <div key={c.code}>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: COLOR[c.code] }}
                      />
                      {c.name}
                    </p>

                    {suyos.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin ventas.</p>
                    ) : (
                      <ol className="flex flex-col gap-1">
                        {suyos.map((p, i) => (
                          <li
                            key={`${p.code}-${p.product_id}`}
                            className="flex items-baseline gap-2 text-xs"
                          >
                            <span className="w-4 shrink-0 tabular-nums text-muted-foreground">
                              {i + 1}.
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {p.name || `Producto ${p.product_id}`}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {p.units} u.
                            </span>
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

const Kpi = ({
  titulo,
  valor,
  nota,
  alerta,
  loading,
}: {
  titulo: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
  loading: boolean;
}) => (
  <Card>
    <CardContent className="p-4">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {alerta && <AlertTriangle className="h-3 w-3 text-warning" />}
        {titulo}
      </p>
      {loading ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight">{valor}</p>
      )}
      {nota && <p className="mt-1 text-[11px] text-muted-foreground">{nota}</p>}
    </CardContent>
  </Card>
);

const Fila = ({ canal }: { canal: ChannelMetricsApi }) => {
  const delta = canal.delta_sold_pct;
  const sube = delta !== null && delta > 0;

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-3">
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: COLOR[canal.code] }}
          />
          {canal.name}
        </span>
      </td>
      <td className="py-2 pr-3 text-right tabular-nums">{soles(canal.sold)}</td>
      <td className="py-2 pr-3 text-right tabular-nums">
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
            {sube ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </td>
      <td className="py-2 pr-3 text-right tabular-nums">{soles(canal.collected)}</td>
      <td className="py-2 pr-3 text-right tabular-nums">
        {canal.coverage_pct === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              "text-xs font-medium",
              canal.coverage_pct < 60 ? "text-warning" : "text-muted-foreground"
            )}
          >
            {canal.coverage_pct}%
          </span>
        )}
      </td>
      <td className="py-2 pr-3 text-right tabular-nums">{canal.orders}</td>
      <td className="py-2 pr-3 text-right tabular-nums">
        {canal.median_ticket === null ? "—" : soles(canal.median_ticket)}
      </td>
      <td className="py-2 text-right tabular-nums text-muted-foreground">
        {canal.share_pct === null ? "—" : `${canal.share_pct}%`}
      </td>
    </tr>
  );
};

const Vacio = ({ texto }: { texto: string }) => (
  <p className="py-8 text-center text-sm text-muted-foreground">{texto}</p>
);

export default ChannelsPage;
