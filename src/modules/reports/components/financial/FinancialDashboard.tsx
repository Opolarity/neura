import { Grid, Col } from '@tremor/react';
import { KpiCard } from '../shared/KpiCard';
import { CashflowChart } from './CashflowChart';
import { FinancialByClassChart } from './FinancialByClassChart';
import { FinancialByPaymentChart } from './FinancialByPaymentChart';
import { useFinancialDashboard } from '../../hooks/useFinancialDashboard';
import type { ReportsFilters } from '../../types/reports.types';
import { formatCurrency } from '@/shared/utils/currency';

interface FinancialDashboardProps {
  filters: ReportsFilters;
}

export function FinancialDashboard({ filters }: FinancialDashboardProps) {
  const dash = useFinancialDashboard(filters);
  const kpis = dash.kpis.data;

  const netColor = kpis && kpis.net_cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Col>
          <KpiCard
            title="Ingresos"
            value={kpis ? formatCurrency(kpis.total_income) : '—'}
            loading={dash.kpis.isLoading}
            subtitle={`${kpis?.income_count ?? 0} transacciones`}
          />
        </Col>
        <Col>
          <KpiCard
            title="Egresos"
            value={kpis ? formatCurrency(kpis.total_expense) : '—'}
            loading={dash.kpis.isLoading}
            subtitle={`${kpis?.expense_count ?? 0} transacciones`}
          />
        </Col>
        <Col>
          <KpiCard
            title="Flujo neto"
            value={kpis ? formatCurrency(kpis.net_cashflow) : '—'}
            loading={dash.kpis.isLoading}
            subtitle="ingresos − egresos"
          />
        </Col>
        <Col>
          <KpiCard
            title="Total transacciones"
            value={kpis?.transaction_count ?? '—'}
            loading={dash.kpis.isLoading}
          />
        </Col>
      </Grid>

      {/* Cashflow over time */}
      <CashflowChart
        data={dash.cashflowOverTime.data ?? []}
        loading={dash.cashflowOverTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* By class + By payment method */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        <Col>
          <FinancialByClassChart
            data={dash.byClass.data ?? []}
            loading={dash.byClass.isLoading}
          />
        </Col>
        <Col>
          <FinancialByPaymentChart
            data={dash.byPaymentMethod.data ?? []}
            loading={dash.byPaymentMethod.isLoading}
          />
        </Col>
      </Grid>
    </div>
  );
}
