import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/reports.service';
import { getWarehousesIsActiveTrue } from '@/shared/services/service';
import type { Granularity, ReportsFilters } from '../types/reports.types';

export function useInventoryDashboard(filters: ReportsFilters) {
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
  const [threshold, setThreshold] = useState(10);
  const [page, setPage] = useState(1);
  const [flowGranularity, setFlowGranularity] = useState<Granularity>('day');
  const [termGroupId, setTermGroupId] = useState<number | undefined>(undefined);
  const [deadStockDays, setDeadStockDays] = useState(60);
  const [deadStockPage, setDeadStockPage] = useState(1);
  const pageSize = 20;
  const deadStockPageSize = 10;

  const warehouses = useQuery({
    queryKey: ['rpt_warehouses'],
    queryFn: getWarehousesIsActiveTrue,
    staleTime: 1000 * 60 * 30,
  });

  const summary = useQuery({
    queryKey: ['rpt_inventory_summary', warehouseId, threshold],
    queryFn: () => inventoryService.getSummary(warehouseId, threshold),
    staleTime: 1000 * 60 * 5,
  });

  const valuation = useQuery({
    queryKey: ['rpt_inventory_valuation', warehouseId],
    queryFn: () => inventoryService.getValuation(warehouseId),
    staleTime: 1000 * 60 * 5,
  });

  const lowStock = useQuery({
    queryKey: ['rpt_low_stock', warehouseId, threshold, page],
    queryFn: () => inventoryService.getLowStock(warehouseId, threshold, page, pageSize),
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

  return {
    summary,
    valuation,
    lowStock,
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
      setPage(1);
      setDeadStockPage(1);
    },
    threshold,
    setThreshold: (t: number) => {
      setThreshold(t);
      setPage(1);
    },
    page,
    setPage,
    pageSize,
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
  };
}

export type InventoryDashboardState = ReturnType<typeof useInventoryDashboard>;
