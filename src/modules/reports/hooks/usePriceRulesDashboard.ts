import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { priceRulesReportService } from '../services/reports.service';
import type { ReportsFilters } from '../types/reports.types';

/**
 * Vista de la tabla. `used` es la más útil de las cuatro: de las ~53 reglas que
 * lista el SP, la mayoría nunca se aplicó en el rango y llena la pantalla de
 * ceros.
 */
export type PriceRuleView = 'all' | 'used' | 'active' | 'inactive';

export function usePriceRulesDashboard(filters: ReportsFilters) {
  const [view, setView] = useState<PriceRuleView>('all');

  const report = useQuery({
    queryKey: ['rpt_price_rules_report', filters],
    queryFn: () => priceRulesReportService.getReport(filters),
    staleTime: 1000 * 60 * 5,
  });

  const rows = useMemo(() => report.data?.table ?? [], [report.data]);

  // Las eliminadas llegan con is_active = false, pero el KPI "Reglas inactivas"
  // ya no las cuenta: si se colaran en la pestaña "Inactivas", el contador y el
  // número de filas se contradirían. Se quedan solo en "Todas" y en "Usadas",
  // marcadas con su badge.
  const visibleRows = useMemo(() => {
    if (view === 'used')     return rows.filter((r) => r.applications > 0);
    if (view === 'active')   return rows.filter((r) => r.is_active && !r.is_deleted);
    if (view === 'inactive') return rows.filter((r) => !r.is_active && !r.is_deleted);
    return rows;
  }, [rows, view]);

  const maxApplications = useMemo(
    () => Math.max(1, ...rows.map((r) => r.applications)),
    [rows],
  );

  return {
    report,
    rows,
    visibleRows,
    maxApplications,
    view,
    setView,
  };
}
