import { useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ReportsFiltersContext } from '../context/ReportsFiltersContext';
import type { ReportsFilters } from '../types/reports.types';
import { createDefaultReportsFilters } from '../types/reports.types';

function ReportsLayout() {
  // Lazy initializer: la factory se evalúa al montar, no al importar el módulo,
  // que es justo lo que evita arrastrar un rango de fechas obsoleto.
  const [filters, setFilters] = useState<ReportsFilters>(createDefaultReportsFilters);
  const [draft, setDraftState] = useState<ReportsFilters>(createDefaultReportsFilters);
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

        <Outlet />
      </div>
    </ReportsFiltersContext.Provider>
  );
}

export default ReportsLayout;
