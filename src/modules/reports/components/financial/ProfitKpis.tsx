import { AlertTriangle, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { KpiCard } from '../shared/KpiCard';
import type { FinancialProfitKpis as FinancialProfitKpisData } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface Props {
  data: FinancialProfitKpisData | undefined;
  loading: boolean;
}

export function ProfitKpis({ data, loading }: Props) {
  const coverage = data?.cost_coverage_pct ?? null;
  const isLowCoverage = coverage !== null && coverage < 50;

  return (
    <div className="space-y-3">
      {coverage !== null && (
        <div
          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
            isLowCoverage
              ? 'border-warning/30 bg-warning/10 text-warning-foreground'
              : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Cobertura de costo: <strong>{coverage}%</strong> de las unidades vendidas
            {' '}({data?.units_with_known_cost ?? 0} de {data?.units_sold_total ?? 0}).
            {isLowCoverage && ' Las cifras de ganancia/margen solo reflejan los productos con costo cargado — no representan el total del negocio.'}
            {' '}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Qué significa la cobertura de costo" className="inline-flex align-middle">
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm text-foreground space-y-2">
                <p>
                  De las <strong>{data?.units_sold_total ?? 0}</strong> unidades vendidas en el periodo,{' '}
                  <strong>{data?.units_with_known_cost ?? 0}</strong> corresponden a productos que tienen su costo
                  registrado en el catálogo.
                </p>
                <p>
                  Ganancia Neta, Margen y Costo Total se calculan solo sobre esas unidades: si la cobertura es baja,
                  esas cifras no reflejan el total del negocio.
                </p>
                <p className="text-muted-foreground">
                  Para mejorar la cobertura, registra el costo en los productos que aún no lo tienen.
                </p>
              </PopoverContent>
            </Popover>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Ganancia Neta"
          value={data ? formatCurrency(data.net_profit) : '—'}
          loading={loading}
          subtitle="sobre unidades con costo conocido"
        />
        <KpiCard
          title="Margen"
          value={data?.margin_pct !== null && data?.margin_pct !== undefined ? `${data.margin_pct}` : '—'}
          suffix={data?.margin_pct !== null && data?.margin_pct !== undefined ? '%' : ''}
          loading={loading}
        />
        <KpiCard
          title="Costo Total"
          value={data ? formatCurrency(data.total_cost) : '—'}
          loading={loading}
        />
      </div>
    </div>
  );
}
