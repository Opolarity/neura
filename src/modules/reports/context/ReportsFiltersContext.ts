import { createContext, useContext } from 'react';
import type { ReportsFilters } from '../types/reports.types';
import { DEFAULT_REPORTS_FILTERS } from '../types/reports.types';

interface ReportsFiltersContextValue {
  filters: ReportsFilters;
  onChange: (partial: Partial<ReportsFilters>) => void;
}

export const ReportsFiltersContext = createContext<ReportsFiltersContextValue>({
  filters: DEFAULT_REPORTS_FILTERS,
  onChange: () => {},
});

export function useReportsFilters() {
  return useContext(ReportsFiltersContext);
}
