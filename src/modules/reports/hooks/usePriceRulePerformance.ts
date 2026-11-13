import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { priceRulePerformanceService } from '../services/reports.service';
import type { ReportsFilters } from '../types/reports.types';

/**
 * T-1158: desempeño por regla. El filtro de reglas es propio de esta sección
 * (no del filtro general de la página): elegir una o varias reglas limita los
 * indicadores, la tabla y los productos a esas reglas, sin mezclarlas con otras.
 */
export function usePriceRulePerformance(filters: ReportsFilters) {
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  const ruleIds = useMemo(
    () => selectedRuleIds.map(Number).filter((n) => Number.isInteger(n) && n > 0),
    [selectedRuleIds],
  );

  const report = useQuery({
    queryKey: ['rpt_price_rule_performance', filters, ruleIds],
    queryFn: () => priceRulePerformanceService.get(filters, ruleIds),
    staleTime: 1000 * 60 * 5,
    // Al cambiar la selección se sigue viendo lo anterior mientras carga, y el
    // selector no pierde sus opciones.
    placeholderData: keepPreviousData,
  });

  const ruleOptions = useMemo(
    () => (report.data?.rule_options ?? []).map((r) => ({ value: String(r.id), label: r.name })),
    [report.data],
  );

  return {
    report,
    ruleOptions,
    selectedRuleIds,
    setSelectedRuleIds,
    hasSelection: ruleIds.length > 0,
  };
}
