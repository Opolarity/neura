import { useReportsFilters } from '../context/ReportsFiltersContext';
import { PriceRulesDashboard } from '../components/price-rules/PriceRulesDashboard';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

export default function PriceRulesReportPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Reportes de regla de precios</h1>
        <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
      </div>
      <ReportsFilterBar />
      <PriceRulesDashboard filters={filters} />
    </div>
  );
}
