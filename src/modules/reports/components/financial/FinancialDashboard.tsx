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

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Ingresos"
          value={kpis ? formatCurrency(kpis.total_income) : '—'}
          loading={dash.kpis.isLoading}
          subtitle={`${kpis?.income_count ?? 0} transacciones`}
        />
        <KpiCard
          title="Egresos"
          value={kpis ? formatCurrency(kpis.total_expense) : '—'}
          loading={dash.kpis.isLoading}
          subtitle={`${kpis?.expense_count ?? 0} transacciones`}
        />
        <KpiCard
          title="Flujo neto"
          value={kpis ? formatCurrency(kpis.net_cashflow) : '—'}
          loading={dash.kpis.isLoading}
          subtitle="ingresos − egresos"
        />
        <KpiCard
          title="Total transacciones"
          value={kpis?.transaction_count ?? '—'}
          loading={dash.kpis.isLoading}
        />
      </div>

      {/* Cashflow over time */}
      <CashflowChart
        data={dash.cashflowOverTime.data ?? []}
        loading={dash.cashflowOverTime.isLoading}
        granularity={dash.granularity}
        onGranularityChange={dash.setGranularity}
      />

      {/* By class + By payment method */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FinancialByClassChart
          data={dash.byClass.data ?? []}
          loading={dash.byClass.isLoading}
        />
        <FinancialByPaymentChart
          data={dash.byPaymentMethod.data ?? []}
          loading={dash.byPaymentMethod.isLoading}
        />
      </div>
    </div>
  );
}
