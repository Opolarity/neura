import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/reports.service';
import { useLowStockThreshold } from '@/shared/hooks/useLowStockThreshold';
import { getWarehousesIsActiveTrue } from '@/shared/services/service';
import type { Granularity, ReportsFilters } from '../types/reports.types';

/**
 * Filtros propios de Inventario ("Más filtros"). Viven acá y no en
 * ReportsFilters porque no existen en las otras pestañas.
 */
export interface InventoryExtraFilters {
  warehouseId: number | undefined;
  /**
   * Umbral de stock bajo: el valor de referencia es el parámetro global
   * (Configuración > Negocio > Operación). Esto es solo un override de
   * sesión, que no se persiste.
   */
  thresholdOverride: number | undefined;
  /** Lista de precios con la que se valoriza el inventario. undefined = la
   * referencia del SP (la del canal minorista). */
  valuationPriceListId: number | undefined;
}

const EMPTY_EXTRA: InventoryExtraFilters = {
  warehouseId: undefined,
  thresholdOverride: undefined,
  valuationPriceListId: undefined,
};

export function useInventoryDashboard(filters: ReportsFilters, applyVersion: number) {
  // Igual que la barra: lo que se edita es el borrador y las queries recién
  // cambian al dar clic en Aplicar. Antes cada select disparaba la recarga
  // al instante y el botón Aplicar no hacía nada con estos tres filtros.
  const [extraDraft, setExtraDraft] = useState<InventoryExtraFilters>(EMPTY_EXTRA);
  const [extra, setExtra] = useState<InventoryExtraFilters>(EMPTY_EXTRA);
  const { warehouseId, thresholdOverride, valuationPriceListId } = extra;

  const [flowGranularity, setFlowGranularity] = useState<Granularity>('day');
  const [termGroupId, setTermGroupId] = useState<number | undefined>(undefined);
  const [deadStockDays, setDeadStockDays] = useState(60);
  const [deadStockPage, setDeadStockPage] = useState(1);
  const deadStockPageSize = 10;
  // T-269 · bandeja de reposición
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockSearch, setLowStockSearch] = useState('');
  const lowStockPageSize = 10;

  // El Aplicar de la barra incrementa applyVersion: ahí se promueve el
  // borrador. Las páginas vuelven a 1 porque cambia el universo de filas.
  useEffect(() => {
    if (applyVersion === 0) return;
    setExtra(extraDraft);
    setDeadStockPage(1);
    setLowStockPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion]);

  const isExtraDirty =
    extraDraft.warehouseId !== extra.warehouseId ||
    extraDraft.thresholdOverride !== extra.thresholdOverride ||
    extraDraft.valuationPriceListId !== extra.valuationPriceListId;

  const warehouses = useQuery({
    queryKey: ['rpt_warehouses'],
    queryFn: getWarehousesIsActiveTrue,
    staleTime: 1000 * 60 * 30,
  });

  // T-269: el umbral sale del parámetro global y solo del parámetro global.
  // `null` = no configurado; ya no existe el fallback 10.
  const { threshold: globalThreshold, isLoading: thresholdLoading } = useLowStockThreshold();
  const threshold = thresholdOverride ?? globalThreshold;
  // Hasta que se resuelva el parámetro no se consulta, para no pedir dos veces
  // los mismos datos.
  const thresholdReady = thresholdOverride !== undefined || !thresholdLoading;

  const summary = useQuery({
    queryKey: ['rpt_inventory_summary', warehouseId, threshold],
    queryFn: () => inventoryService.getSummary(warehouseId, threshold ?? undefined),
    enabled: thresholdReady,
    staleTime: 1000 * 60 * 5,
  });

  const valuation = useQuery({
    queryKey: ['rpt_inventory_valuation', warehouseId, valuationPriceListId],
    queryFn: () => inventoryService.getValuation(warehouseId, valuationPriceListId),
    staleTime: 1000 * 60 * 5,
  });

  const rotation = useQuery({
    queryKey: ['rpt_stock_rotation', filters, warehouseId],
    queryFn: () => inventoryService.getRotation(filters, warehouseId),
    staleTime: 1000 * 60 * 5,
  });

  const movementTypes = useQuery({
    queryKey: ['rpt_stock_movement_types', filters, warehouseId],
    queryFn: () => inventoryService.getMovementTypes(filters, warehouseId),
    staleTime: 1000 * 60 * 5,
  });

  const stockFlow = useQuery({
    queryKey: ['rpt_stock_flow', filters, flowGranularity, warehouseId],
    queryFn: () => inventoryService.getStockFlow(filters, flowGranularity, warehouseId),
    staleTime: 1000 * 60 * 5,
  });

  const byCategory = useQuery({
    queryKey: ['rpt_stock_by_category', warehouseId],
    queryFn: () => inventoryService.getStockByCategory(warehouseId),
    staleTime: 1000 * 60 * 5,
  });

  const byTermGroup = useQuery({
    queryKey: ['rpt_stock_by_term_group', termGroupId, warehouseId],
    queryFn: () => inventoryService.getStockByTermGroup(termGroupId, warehouseId),
    staleTime: 1000 * 60 * 5,
  });

  const deadStock = useQuery({
    queryKey: ['rpt_dead_stock', deadStockDays, warehouseId, deadStockPage],
    queryFn: () =>
      inventoryService.getDeadStock(deadStockDays, warehouseId, deadStockPage, deadStockPageSize),
    staleTime: 1000 * 60 * 5,
  });

  const lowStockProducts = useQuery({
    queryKey: ['rpt_low_stock_products', warehouseId, threshold, lowStockPage, lowStockSearch],
    queryFn: () =>
      inventoryService.getLowStockProducts(
        warehouseId,
        threshold ?? undefined,
        lowStockPage,
        lowStockPageSize,
        lowStockSearch || undefined,
      ),
    enabled: thresholdReady,
    staleTime: 1000 * 60 * 5,
  });

  return {
    summary,
    valuation,
    lowStockProducts,
    rotation,
    movementTypes,
    stockFlow,
    byCategory,
    byTermGroup,
    deadStock,
    warehouses,
    // Aplicados (los que usan las queries y el Excel)
    warehouseId,
    valuationPriceListId,
    threshold,
    globalThreshold,
    thresholdOverride,
    // Borrador (lo que muestran los selects de "Más filtros")
    extraDraft,
    setExtraDraft: (partial: Partial<InventoryExtraFilters>) =>
      setExtraDraft((prev) => ({ ...prev, ...partial })),
    /** Limpia borrador y aplicado a la vez (botón Limpiar de la barra). */
    clearExtra: () => {
      setExtraDraft(EMPTY_EXTRA);
      setExtra(EMPTY_EXTRA);
      setDeadStockPage(1);
      setLowStockPage(1);
    },
    isExtraDirty,
    flowGranularity,
    setFlowGranularity,
    termGroupId,
    setTermGroupId,
    deadStockDays,
    setDeadStockDays: (days: number) => {
      setDeadStockDays(days);
      setDeadStockPage(1);
    },
    deadStockPage,
    setDeadStockPage,
    deadStockPageSize,
    lowStockPage,
    setLowStockPage,
    lowStockPageSize,
    lowStockSearch,
    setLowStockSearch: (q: string) => {
      setLowStockSearch(q);
      setLowStockPage(1);
    },
  };
}

export type InventoryDashboardState = ReturnType<typeof useInventoryDashboard>;
