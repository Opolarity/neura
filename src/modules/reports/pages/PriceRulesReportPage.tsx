import { useReportsFilters } from '../context/ReportsFiltersContext';
import { PriceRulesDashboard } from '../components/price-rules/PriceRulesDashboard';

export default function PriceRulesReportPage() {
  const { filters } = useReportsFilters();
  return <PriceRulesDashboard filters={filters} />;
}
