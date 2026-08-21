import { Link } from "react-router-dom";
import { AlertTriangle, Info, Plus, RefreshCw } from "lucide-react";
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
import { RANGE_LABELS, useChannelCosts, type RangePreset } from "../hooks/useChannelCosts";

const soles = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const COLOR: Record<string, string> = {
  WA: "hsl(var(--success))",
  IG: "hsl(var(--primary))",
  FB: "hsl(var(--info))",
};

const CostsPage = () => {
  const { preset, setPreset, loading, data, sinCostos, reload } = useChannelCosts();

  const canales = data?.channels ?? [];
  const totalCobrado = canales.reduce((a, c) => a + c.collected, 0);
  const contribucion = totalCobrado - (data?.direct_total ?? 0) - (data?.shared_total ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold leading-tight">Costos por canal</h1>
          <p className="text-sm text-muted-foreground">
            Lo que cuesta sostener cada canal, contra lo que cada canal cobra.
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

          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={reload} disabled={loading}>
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
            Actualizar
          </Button>

          {/* El alta reusa el formulario de gastos que ya existe: los costos del
              canal son egresos normales y tienen que quedar en la contabilidad,
              no en un formulario propio del CRM. */}
          <Button asChild size="sm" className="h-8 px-2.5 text-xs">
            <Link to="/movements/add/expenses">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Registrar gasto
            </Link>
          </Button>
        </div>
      </div>

      {/* Sin un solo movimiento cargado, la contribución sería idéntica a lo
          cobrado y se leería como 100 % de ganancia. Antes que mostrar eso, se
          dice que falta el dato. */}
      {!loading && sinCostos && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-2 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium">Todavía no hay ningún costo cargado.</p>
              <p className="mt-1 text-muted-foreground">
                Las seis clases de gasto ya existen (WhatsApp API, Instagram Ads,
                Facebook Ads, Infra, IA y Asesores), pero nadie registró
                movimientos en ellas. Hasta que se carguen, la contribución sería
                igual a lo cobrado y parecería que todo es ganancia, así que no se
                muestra.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Por qué no dice "margen" */}
      {!loading && data && !data.product_cost.margin_available && (
        <Card className="border-info/40 bg-info/5">
          <CardContent className="flex items-start gap-2 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <div className="text-sm">
              <p className="font-medium">Esto no es el margen, es la contribución.</p>
              <p className="mt-1 text-muted-foreground">
                El margen exigiría restar también el costo de la mercadería, y el
                ERP lo tiene cargado en{" "}
                <strong className="font-medium">
                  {data.product_cost.with_cost} de {data.product_cost.variations}{" "}
                  variantes ({data.product_cost.coverage_pct ?? 0} %)
                </strong>
                . Calcularlo con eso daría un margen inventado y, además, inflado.
                Cuando se carguen los costos de producto, el margen aparece acá
                solo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Cobrado por los 3 canales" valor={soles(totalCobrado)} loading={loading} />
        <Kpi
          titulo="Costo directo de canal"
          valor={soles(data?.direct_total ?? 0)}
          nota="WhatsApp API, Instagram Ads, Facebook Ads"
          loading={loading}
        />
        <Kpi
          titulo="Costos compartidos"
          valor={soles(data?.shared_total ?? 0)}
          nota="Infra, IA y asesores. No se reparten."
          loading={loading}
        />
        <Kpi
          titulo="Contribución"
          valor={sinCostos ? "—" : soles(contribucion)}
          nota={sinCostos ? "Faltan cargar los costos" : "Cobrado menos todos los costos"}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Por canal</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Canal</th>
                  <th className="pb-2 pr-3 text-right font-medium">Cobrado</th>
                  <th className="pb-2 pr-3 text-right font-medium">Costo directo</th>
                  <th className="pb-2 pr-3 text-right font-medium">% del cobrado</th>
                  <th className="pb-2 pr-3 text-right font-medium">Costo por pedido</th>
                  <th className="pb-2 text-right font-medium">Contribución</th>
                </tr>
              </thead>
              <tbody>
                {canales.map((c) => (
                  <tr key={c.code} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ background: COLOR[c.code] }}
                        />
                        {c.name}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{soles(c.collected)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {c.cost_entries === 0 ? (
                        <span className="text-xs text-muted-foreground">sin cargar</span>
                      ) : (
                        soles(c.direct_cost)
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {c.cost_entries === 0 || c.cost_ratio_pct === null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            c.cost_ratio_pct > 30 ? "text-warning" : "text-muted-foreground"
                          )}
                        >
                          {c.cost_ratio_pct}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {c.cost_entries === 0 || c.cost_per_order === null
                        ? "—"
                        : soles(c.cost_per_order)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {c.cost_entries === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={cn(
                            "font-medium",
                            c.contribution < 0 && "text-destructive"
                          )}
                        >
                          {soles(c.contribution)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            La contribución se calcula sobre lo <strong className="font-medium">cobrado</strong>,
            no sobre lo vendido: los costos ya salieron de la caja, y restarlos de
            plata que todavía no entró daría una cifra que no existe en la cuenta.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Costos compartidos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(data?.shared.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin costos compartidos cargados en el período.
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data?.shared.map((s) => (
                  <tr key={s.class_code} className="border-b last:border-0">
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground">
                      {s.entries} {s.entries === 1 ? "movimiento" : "movimientos"}
                    </td>
                    <td className="py-2 text-right tabular-nums">{soles(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            El VPS, Gemini y los sueldos de los asesores sostienen los tres canales
            a la vez. <strong className="font-medium">No se reparten entre ellos</strong>:
            prorratearlos por participación de ventas daría un número prolijo pero
            inventado. Se restan del total, no de cada canal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const Kpi = ({
  titulo,
  valor,
  nota,
  loading,
}: {
  titulo: string;
  valor: string;
  nota?: string;
  loading: boolean;
}) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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

export default CostsPage;
