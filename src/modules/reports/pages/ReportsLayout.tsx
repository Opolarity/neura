import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { ReportsFiltersContext } from '../context/ReportsFiltersContext';
import type { ReportsFilters } from '../types/reports.types';
import { DEFAULT_REPORTS_FILTERS } from '../types/reports.types';

function ReportsLayout() {
  const [filters, setFilters] = useState<ReportsFilters>(DEFAULT_REPORTS_FILTERS);

  function handleFilterChange(partial: Partial<ReportsFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  return (
    <ReportsFiltersContext.Provider value={{ filters, onChange: handleFilterChange }}>
      <div className="p-6 space-y-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
        </div>

        <ReportsFilterBar filters={filters} onChange={handleFilterChange} />

        <Outlet />
      </div>
    </ReportsFiltersContext.Provider>
  );
}

export default ReportsLayout;
