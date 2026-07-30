import { useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { ReportsFiltersContext } from '../context/ReportsFiltersContext';
import type { ReportsFilters } from '../types/reports.types';
import { DEFAULT_REPORTS_FILTERS } from '../types/reports.types';

function ReportsLayout() {
  const [filters, setFilters] = useState<ReportsFilters>(DEFAULT_REPORTS_FILTERS);
  const [draft, setDraftState] = useState<ReportsFilters>(DEFAULT_REPORTS_FILTERS);
  const [applyVersion, setApplyVersion] = useState(0);

  const setDraft = useCallback((partial: Partial<ReportsFilters>) => {
    setDraftState((prev) => ({ ...prev, ...partial }));
  }, []);

  const apply = useCallback(() => {
    setFilters(draft);
    setApplyVersion((v) => v + 1);
  }, [draft]);

  const applyImmediate = useCallback((next: ReportsFilters) => {
    setDraftState(next);
    setFilters(next);
    setApplyVersion((v) => v + 1);
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(filters),
    [draft, filters],
  );

  return (
    <ReportsFiltersContext.Provider
      value={{ filters, draft, setDraft, apply, applyImmediate, isDirty, applyVersion }}
    >
      <div className="p-6 space-y-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
        </div>

        <ReportsFilterBar />

        <Outlet />
      </div>
    </ReportsFiltersContext.Provider>
  );
}

export default ReportsLayout;
