import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, PackageSearch, Target } from 'lucide-react';
import { MultiSelect } from '@/shared/components/MultiSelect';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateDisplay } from '@/shared/utils/date';
import { KpiCard } from '../shared/KpiCard';
import { usePriceRulePerformance } from '../../hooks/usePriceRulePerformance';
import type { PriceRulePerformanceRow } from '../../services/reports.service';
import type { ReportsFilters } from '../../types/reports.types';

interface Props {
  filters: ReportsFilters;
}

const n = (v: number) => v.toLocaleString('es-PE');
const dash = <span className="text-muted-foreground">—</span>;

/**
 * T-1158: desempeño de cada regla con lo que el motor decidió en cada pedido
 * (order_price_rule_items). Cada regla se mide con sus propias unidades y
 * descuentos, así que dos reglas del mismo pedido no se mezclan.
 */
export function PriceRulePerformance({ filters }: Props) {
  const { report, ruleOptions, selectedRuleIds, setSelectedRuleIds, hasSelection } =
    usePriceRulePerformance(filters);

  const data = report.data;
  const loading = report.isLoading;
  const kpis = data?.kpis;
  const rules = data?.rules ?? [];
  const products = data?.products ?? [];
  // Con una sola regla la columna "Regla" de productos sobra.
  const singleRule = rules.length === 1;
  // Unidades, venta y descuento de varias reglas son una suma: una unidad que
  // tomaron dos reglas acumulables cuenta en las dos.
  const sumHint = kpis && kpis.rules > 1 ? `Suma de ${n(kpis.rules)} reglas` : undefined;

  return (
    <Card>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Desempeño por regla
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.tracked_from
                ? `Unidades, venta y descuento que el sistema registró por regla desde el ${formatDateDisplay(data.tracked_from)}. Los pedidos anteriores no tienen este detalle.`
                : 'Todavía no hay pedidos con este detalle: se registra desde que se activó en el sistema.'}
            </p>
          </div>
          <div className="w-full sm:w-80">
            <MultiSelect
              options={ruleOptions}
              value={selectedRuleIds}
              onChange={setSelectedRuleIds}
              placeholder="Todas las reglas"
              showSearch
              showClear
              disabled={ruleOptions.length === 0 && !hasSelection}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard title="Pedidos" value={kpis?.orders ?? 0} subtitle="donde aplicó" loading={loading} />
          <KpiCard
            title="Unidades vendidas"
            value={kpis?.units ?? 0}
            subtitle={
              kpis
                ? [
                    `${n(kpis.discounted_units)} bonificadas`,
                    kpis.gift_units > 0 ? `${n(kpis.gift_units)} regaladas` : null,
                    sumHint,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
            loading={loading}
          />
          <KpiCard
            title="Venta generada"
            value={formatCurrency(kpis?.sales ?? 0)}
            subtitle={sumHint ?? 'de las unidades de la promoción'}
            loading={loading}
          />
          <KpiCard
            title="Descuento otorgado"
            value={formatCurrency(kpis?.discount ?? 0)}
            subtitle={sumHint ?? 'incluye regalos y envío'}
            loading={loading}
          />
          <KpiCard
            title="Ticket promedio"
            value={formatCurrency(kpis?.avg_ticket ?? 0)}
            subtitle="de esos pedidos"
            loading={loading}
          />
          <KpiCard title="Productos" value={kpis?.products ?? 0} subtitle="distintos vendidos" loading={loading} />
        </div>

        {/* Una fila por regla */}
        <div className="rounded-md border">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Sin datos para el período seleccionado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left  px-4 py-3 font-medium text-muted-foreground">Regla</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pedidos</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Unidades</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Bonificadas</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Venta generada</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Descuento</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Ticket promedio</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id ?? `deleted-${r.name}`} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <RuleName row={r} onSelect={r.id ? () => setSelectedRuleIds([String(r.id)]) : undefined} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{n(r.orders)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.units > 0 ? n(r.units) : dash}
                        {r.gift_units > 0 && (
                          <p className="text-[11px] text-muted-foreground">+{n(r.gift_units)} regaladas</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                        {r.discounted_units > 0 ? n(r.discounted_units) : dash}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {r.units > 0 ? formatCurrency(r.sales) : dash}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(r.discount)}
                        {(r.gift_discount !== 0 || r.shipping_discount !== 0) && (
                          <p className="text-[11px] text-muted-foreground">
                            {[
                              r.gift_discount !== 0 ? `regalos ${formatCurrency(r.gift_discount)}` : null,
                              r.shipping_discount !== 0 ? `envío ${formatCurrency(r.shipping_discount)}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{formatCurrency(r.avg_ticket)}</td>
                      <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">
                        {r.products > 0 ? n(r.products) : dash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Productos vendidos con la regla */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <PackageSearch className="w-4 h-4" />
            Productos vendidos con {hasSelection && singleRule ? `"${rules[0].name}"` : 'las reglas'}
          </h3>
          <div className="rounded-md border">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Sin productos para mostrar</p>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr className="border-b">
                      <th className="text-left  px-4 py-3 font-medium text-muted-foreground">Producto</th>
                      {!singleRule && (
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Regla</th>
                      )}
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Pedidos</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Unidades</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Bonificadas</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Venta</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Descuento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr
                        key={`${p.rule_id ?? p.rule_name}-${p.variation_id ?? 'x'}-${p.is_gift ? 'g' : 's'}`}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[260px]">{p.product_name}</span>
                            {p.is_gift && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Gift className="w-3 h-3" /> Regalo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {[p.variation_name, p.sku].filter(Boolean).join(' · ')}
                          </p>
                        </td>
                        {!singleRule && (
                          <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                            {p.rule_name}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{n(p.orders)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{n(p.units)}</td>
                        <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                          {p.discounted_units > 0 ? n(p.discounted_units) : dash}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {p.is_gift ? dash : formatCurrency(p.sales)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.discount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {data?.products_truncated && (
            <p className="text-xs text-muted-foreground">
              Se muestran los {n(products.length)} productos con más unidades. El Excel trae la lista completa.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleName({ row, onSelect }: { row: PriceRulePerformanceRow; onSelect?: () => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`w-2 h-2 rounded-full shrink-0 ${row.is_active ? 'bg-success' : 'bg-pending'}`} />
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="font-medium truncate max-w-[220px] text-left hover:underline"
          title="Ver solo esta regla"
        >
          {row.name}
        </button>
      ) : (
        <span className="font-medium truncate max-w-[220px]">{row.name}</span>
      )}
      {row.code && (
        <Badge variant="outline" className="text-xs hidden sm:inline-flex">{row.code}</Badge>
      )}
      {row.is_deleted && <Badge variant="destructive-soft" className="text-xs">Eliminada</Badge>}
    </div>
  );
}
