import { useReportsFilters } from '../context/ReportsFiltersContext';
import { PriceRulesDashboard } from '../components/price-rules/PriceRulesDashboard';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';

export default function PriceRulesReportPage() {
  const { filters } = useReportsFilters();
  return (
    <div className="space-y-4">
      <ReportsFilterBar />
      <PriceRulesDashboard filters={filters} />
    </div>
  );
}
