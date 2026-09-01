import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/reports.service';
import { useLowStockThreshold } from '@/shared/hooks/useLowStockThreshold';
import { getWarehousesIsActiveTrue } from '@/shared/services/service';
import type { Granularity, ReportsFilters } from '../types/reports.types';

export function useInventoryDashboard(filters: ReportsFilters) {
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
  // Umbral de stock bajo: el valor de referencia es el parámetro global
  // (Configuración > Negocio > Operación). El selector del reporte solo
  // define un override de sesión, que no se persiste.
  const [thresholdOverride, setThresholdOverride] = useState<number | undefined>(undefined);
  const [flowGranularity, setFlowGranularity] = useState<Granularity>('day');
  const [termGroupId, setTermGroupId] = useState<number | undefined>(undefined);
  const [deadStockDays, setDeadStockDays] = useState(60);
  const [deadStockPage, setDeadStockPage] = useState(1);
  const deadStockPageSize = 10;
  // T-269 · bandeja de reposición
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockSearch, setLowStockSearch] = useState('');
  const lowStockPageSize = 10;

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
    queryKey: ['rpt_inventory_valuation', warehouseId],
    queryFn: () => inventoryService.getValuation(warehouseId),
    staleTime: 1000 * 60 * 5,
  });

  const lowStockDistribution = useQuery({
    queryKey: ['rpt_low_stock_distribution', warehouseId, threshold],
    queryFn: () => inventoryService.getLowStockDistribution(warehouseId, threshold ?? undefined),
    enabled: thresholdReady,
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
    lowStockDistribution,
    lowStockProducts,
    rotation,
    movementTypes,
    stockFlow,
    byCategory,
    byTermGroup,
    deadStock,
    warehouses,
    warehouseId,
    setWarehouseId: (id: number | undefined) => {
      setWarehouseId(id);
      setDeadStockPage(1);
      setLowStockPage(1);
    },
    threshold,
    globalThreshold,
    thresholdOverride,
    setThresholdOverride,
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
