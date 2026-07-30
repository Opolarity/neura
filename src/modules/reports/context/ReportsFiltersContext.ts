import { createContext, useContext } from 'react';
import type { ReportsFilters } from '../types/reports.types';
import { DEFAULT_REPORTS_FILTERS } from '../types/reports.types';

interface ReportsFiltersContextValue {
  /** Filtros aplicados — lo que usan las queries de cada pestaña. */
  filters: ReportsFilters;
  /** Filtros en edición — lo que muestran los inputs, aún sin aplicar. */
  draft: ReportsFilters;
  setDraft: (partial: Partial<ReportsFilters>) => void;
  /** Commitea draft -> filters. */
  apply: () => void;
  /** Aplica un valor inmediatamente, sin esperar al botón (ej. "Limpiar"). */
  applyImmediate: (next: ReportsFilters) => void;
  /** true cuando hay cambios en draft sin aplicar. */
  isDirty: boolean;
  /** Se incrementa en cada apply()/applyImmediate() — para sincronizar estado local de otras pestañas (ej. filtros propios de Ventas). */
  applyVersion: number;
}

export const ReportsFiltersContext = createContext<ReportsFiltersContextValue>({
  filters: DEFAULT_REPORTS_FILTERS,
  draft: DEFAULT_REPORTS_FILTERS,
  setDraft: () => {},
  apply: () => {},
  applyImmediate: () => {},
  isDirty: false,
  applyVersion: 0,
});

export function useReportsFilters() {
  return useContext(ReportsFiltersContext);
}
