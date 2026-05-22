import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tags, Zap, Ticket, CheckCircle2, XCircle } from 'lucide-react';
import {
  priceRulesReportService,
  type PriceRuleKpis,
  type PriceRuleReportRow,
} from '../../services/reports.service';
import type { ReportsFilters } from '../../types/reports.types';

type StatusFilter = 'all' | 'active' | 'inactive';

interface Props {
  filters: ReportsFilters;
}

export function PriceRulesDashboard({ filters }: Props) {
  const [kpis, setKpis] = useState<PriceRuleKpis>({ active: 0, inactive: 0, automatic: 0, coupon: 0 });
  const [rows, setRows] = useState<PriceRuleReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      priceRulesReportService.getKpis(),
      priceRulesReportService.getTable(filters.startDate, filters.endDate),
    ])
      .then(([k, r]) => {
        setKpis(k);
        setRows(r);
      })
      .finally(() => setLoading(false));
  }, [filters.startDate, filters.endDate]);

  const filteredRows = useMemo(() => {
    if (statusFilter === 'active')   return rows.filter((r) => r.is_active);
    if (statusFilter === 'inactive') return rows.filter((r) => !r.is_active);
    return rows;
  }, [rows, statusFilter]);

  const maxApplications = useMemo(
    () => Math.max(1, ...rows.map((r) => r.applications)),
    [rows]
  );

  return (
    <div className="space-y-6 mt-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Reglas activas"   value={kpis.active}    loading={loading} />
        <StatCard icon={<XCircle      className="w-5 h-5 text-red-400"   />} label="Reglas inactivas" value={kpis.inactive}  loading={loading} />
        <StatCard icon={<Zap          className="w-5 h-5 text-blue-500"  />} label="Automáticas"      value={kpis.automatic} loading={loading} />
        <StatCard icon={<Ticket       className="w-5 h-5 text-purple-500"/>} label="Cupones"           value={kpis.coupon}    loading={loading} />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="w-4 h-4 text-primary" />
              Reglas por aplicación
            </CardTitle>
            <div className="flex gap-1 p-1 bg-muted rounded-lg text-sm">
              {(['all', 'active', 'inactive'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statusFilter === f
                      ? 'bg-background shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}
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
          ) : filteredRows.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Sin datos para el período seleccionado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Uso (aplicaciones)</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rendimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${row.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium truncate max-w-[200px]">{row.name}</span>
                          {row.code && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">{row.code}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={row.rule_type === 'automatic' ? 'secondary' : 'outline'} className="text-xs">
                          {row.rule_type === 'automatic' ? 'Automática' : 'Cupón'}
                        </Badge>
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
                      <td className="px-4 py-3">
                        {row.rendimiento > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            ↗ {row.rendimiento}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: ReactNode; label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
              <div className="h-7 w-10 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
