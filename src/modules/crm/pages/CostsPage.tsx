import { Link } from "react-router-dom";
import { AlertTriangle, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { ChannelName } from "../components/channels/ChannelName";
import { ChannelPageHeader } from "../components/channels/ChannelPageHeader";
import { useChannelCosts } from "../hooks/useChannelCosts";

const CostsPage = () => {
  const { preset, setPreset, loading, data, sinCostos, reload } = useChannelCosts();

  const canales = data?.channels ?? [];
  const totalCobrado = canales.reduce((a, c) => a + c.collected, 0);
  const contribucion = totalCobrado - (data?.direct_total ?? 0) - (data?.shared_total ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <ChannelPageHeader
        title="Costos por canal"
        preset={preset}
        onPresetChange={setPreset}
        loading={loading}
        onReload={reload}
      >
        {/* El alta reusa el formulario de gastos: los costos del canal son
            egresos normales y tienen que quedar en la contabilidad. */}
        <Button asChild size="sm" className="h-8 px-2.5 text-xs">
          <Link to="/movements/add/expenses">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Registrar gasto
          </Link>
        </Button>
      </ChannelPageHeader>

      {/* Sin un solo movimiento cargado, la contribución sería idéntica a lo
          cobrado y se leería como 100 % de ganancia: se dice que falta el dato. */}
      {!loading && sinCostos && (
        <div className="flex items-start gap-2 rounded-lg bg-warning-soft p-4 text-warning-soft-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Todavía no hay ningún costo cargado.</p>
            <p className="mt-1">
              Las clases de gasto ya existen (Canal - WhatsApp API, Canal - Instagram Ads, Canal - Facebook
              Ads, Canal - TikTok Ads, Infraestructura, Inteligencia artificial y Personal - Asesores), pero
              no hay movimientos en ellas. Regístralos con "Registrar gasto" eligiendo esas clases.
            </p>
          </div>
        </div>
      )}

      {/* Por qué no dice "margen". */}
      {!loading && data && !data.product_cost.margin_available && (
        <div className="flex items-start gap-2 rounded-lg border bg-background p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Esto no es el margen, es la contribución.</p>
            <p className="mt-1 text-muted-foreground">
              El margen exigiría restar también el costo de la mercadería, y está cargado en{" "}
              <strong className="font-medium">
                {data.product_cost.with_cost} de {data.product_cost.variations} variantes (
                {data.product_cost.coverage_pct ?? 0} %)
              </strong>
              . Calcularlo con eso daría un margen inventado.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Cobrado por los canales de chat" value={formatCurrency(totalCobrado)} loading={loading} />
        <KpiCard
          title="Costo directo de canal"
          value={formatCurrency(data?.direct_total ?? 0)}
          subtitle="WhatsApp API e Instagram, Facebook y TikTok Ads"
          loading={loading}
        />
        <KpiCard
          title="Costos compartidos"
          value={formatCurrency(data?.shared_total ?? 0)}
          subtitle="Infra, IA y asesores. No se reparten."
          loading={loading}
        />
        <KpiCard
          title="Contribución"
          value={sinCostos ? "—" : formatCurrency(contribucion)}
          subtitle={sinCostos ? "Faltan cargar los costos" : "Cobrado menos todos los costos"}
          loading={loading}
        />
      </div>

      <Card className="flex min-h-0 flex-col overflow-hidden">
        <CardHeader className="!p-4">
          <CardTitle className="text-base font-semibold">Por canal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Cobrado</TableHead>
                <TableHead className="text-right">Costo directo</TableHead>
                <TableHead className="text-right">% del cobrado</TableHead>
                <TableHead className="text-right">Costo por pedido</TableHead>
                <TableHead className="text-right">Contribución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {canales.map((c) => (
                <TableRow key={c.code}>
                  <TableCell>
                    <ChannelName code={c.code} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(c.collected)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.cost_entries === 0 ? (
                      <span className="text-xs text-muted-foreground">sin cargar</span>
                    ) : (
                      formatCurrency(c.direct_cost)
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.cost_entries === 0 || c.cost_ratio_pct === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          c.cost_ratio_pct > 30 ? "text-warning-soft-foreground" : "text-muted-foreground"
                        )}
                      >
                        {c.cost_ratio_pct}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.cost_entries === 0 || c.cost_per_order === null ? "—" : formatCurrency(c.cost_per_order)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.cost_entries === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className={cn("font-medium", c.contribution < 0 && "text-destructive")}>
                        {formatCurrency(c.contribution)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="px-4 pb-4 pt-3 text-[11px] leading-relaxed text-muted-foreground">
            La contribución se calcula sobre lo <strong className="font-medium">cobrado</strong>, no sobre lo
            vendido: los costos ya salieron de la caja, y restarlos de plata que todavía no entró daría una
            cifra que no existe en la cuenta.
          </p>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-col overflow-hidden">
        <CardHeader className="!p-4">
          <CardTitle className="text-base font-semibold">Costos compartidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(data?.shared.length ?? 0) === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin costos compartidos cargados en el período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead className="text-right">Movimientos</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.shared.map((s) => (
                  <TableRow key={s.class_code}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{s.entries}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(s.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="px-4 pb-4 pt-3 text-[11px] leading-relaxed text-muted-foreground">
            La infraestructura, la IA y los asesores sostienen todos los canales a la vez.{" "}
            <strong className="font-medium">No se reparten entre ellos</strong>: prorratearlos por ventas daría
            un número prolijo pero inventado. Se restan del total, no de cada canal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostsPage;
