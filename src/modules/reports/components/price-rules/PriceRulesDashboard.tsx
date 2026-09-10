import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tags, CheckCircle2, Percent, Zap, Coins } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateDisplay } from '@/shared/utils/date';
import { reportChartColors } from '../shared/reportChartUtils';
import { usePriceRulesDashboard, type PriceRuleView } from '../../hooks/usePriceRulesDashboard';
import type { PriceRuleReportRow } from '../../services/reports.service';
import type { ReportsFilters } from '../../types/reports.types';

const VIEWS: { key: PriceRuleView; label: string }[] = [
  { key: 'all',      label: 'Todas' },
  { key: 'used',     label: 'Usadas' },
  { key: 'active',   label: 'Activas' },
  { key: 'inactive', label: 'Inactivas' },
];

interface Props {
  filters: ReportsFilters;
}

export function PriceRulesDashboard({ filters }: Props) {
  const { report, visibleRows, maxApplications, view, setView } = usePriceRulesDashboard(filters);

  const loading = report.isLoading;
  const kpis = report.data?.kpis ?? {
    active: 0,
    inactive: 0,
    used: 0,
    applications: 0,
    revenue: 0,
    orders_with_rule: 0,
    orders_total: 0,
    revenue_total: 0,
  };
  // "Venta con regla" se lee sobre el total de pedidos del período: cuántos
  // tuvieron al menos una regla y qué porcentaje son.
  const ruleShare =
    kpis.orders_total > 0 ? ((kpis.orders_with_rule / kpis.orders_total) * 100).toFixed(1) : null;
  const other = report.data?.other;

  // La fila de "Otros descuentos" solo tiene sentido en "Todas": no es una
  // regla, así que no puede estar activa, inactiva ni usada.
  const showOther = view === 'all' && (other?.applications ?? 0) > 0;

  return (
    <div className="space-y-6 mt-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          label="Reglas activas"
          hint={`${kpis.inactive.toLocaleString('es-PE')} apagadas`}
          value={kpis.active.toLocaleString('es-PE')}
          loading={loading}
        />
        <StatCard
          icon={<Zap className="w-5 h-5" style={{ color: reportChartColors.blue }} />}
          label="Reglas usadas"
          hint="en el período"
          value={kpis.used.toLocaleString('es-PE')}
          loading={loading}
        />
        <StatCard
          icon={<Percent className="w-5 h-5" style={{ color: reportChartColors.violet }} />}
          label="Aplicaciones"
          hint="en el período"
          value={kpis.applications.toLocaleString('es-PE')}
          loading={loading}
        />
        <StatCard
          icon={<Coins className="w-5 h-5 text-success" />}
          label="Venta con regla"
          hint={
            ruleShare !== null
              ? `${kpis.orders_with_rule.toLocaleString('es-PE')} de ${kpis.orders_total.toLocaleString('es-PE')} pedidos (${ruleShare}% del total)`
              : 'pedidos con al menos una regla'
          }
          value={formatCurrency(kpis.revenue)}
          loading={loading}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Reglas por aplicación
            </CardTitle>
            <div className="flex gap-1 p-1 bg-muted rounded-lg text-sm">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    view === v.key
                      ? 'bg-background shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleRows.length === 0 && !showOther ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Sin datos para el período seleccionado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left  px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left  px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Tipo</th>
                    <th className="text-left  px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Vigencia</th>
                    <th className="text-left  px-4 py-3 font-medium text-muted-foreground">Uso (aplicaciones)</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Pedidos</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Venta generada</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">% de uso</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${row.is_active ? 'bg-success' : 'bg-pending'}`} />
                          <span className="font-medium truncate max-w-[200px]">{row.name}</span>
                          {row.code && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">{row.code}</Badge>
                          )}
                          {/* Aparece solo si la regla se eliminó pero tuvo ventas en el rango. */}
                          {row.is_deleted && (
                            <Badge variant="destructive-soft" className="text-xs">Eliminada</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={row.rule_type === 'automatic' ? 'secondary' : 'outline'} className="text-xs">
                          {row.rule_type === 'automatic' ? 'Automática' : 'Cupón'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {describeValidity(row)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold w-16 shrink-0 tabular-nums">
                            {row.applications.toLocaleString('es-PE')}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-1.5 min-w-[80px]">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ width: `${(row.applications / maxApplications) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                        {row.orders > 0 ? row.orders.toLocaleString('es-PE') : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {row.applications > 0 ? formatCurrency(row.revenue) : <span className="font-normal text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                        {row.applications > 0 ? `${row.share}%` : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}

                  {/*
                    Los descuentos que no salen de una regla. Van al pie y sin
                    barra de uso: no compiten por participación con las reglas,
                    y por eso su "% de uso" es un guion.
                  */}
                  {showOther && other && (
                    <tr className="border-t bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground/40" />
                          <span className="font-medium">Otros descuentos</span>
                          <Badge variant="outline" className="text-xs">No vienen de una regla</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 pl-4">
                          {other.codes.join(', ')}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">—</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">—</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold w-16 shrink-0 tabular-nums">
                          {other.applications.toLocaleString('es-PE')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                        {other.orders.toLocaleString('es-PE')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatCurrency(other.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">—</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 19 de las reglas apagadas lo están porque se les venció la vigencia. Sin esta
 * columna la pantalla decía "inactiva" sin decir por qué.
 */
function describeValidity(row: PriceRuleReportRow): string {
  if (!row.valid_from && !row.valid_to) return 'Sin límite';
  if (row.valid_from && row.valid_to) {
    return `${formatDateDisplay(row.valid_from)} – ${formatDateDisplay(row.valid_to)}`;
  }
  if (row.valid_from) return `Desde ${formatDateDisplay(row.valid_from)}`;
  return `Hasta ${formatDateDisplay(row.valid_to!)}`;
}

function StatCard({
  icon,
  label,
  hint,
  value,
  loading,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  value: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          {icon}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold tabular-nums truncate">{value}</p>
            )}
            <p className="text-[11px] text-muted-foreground">{hint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
