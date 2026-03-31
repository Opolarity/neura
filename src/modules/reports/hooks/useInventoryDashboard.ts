import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/reports.service';
import type { ReportsFilters } from '../types/reports.types';

export function useInventoryDashboard(filters: ReportsFilters) {
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
  const [threshold, setThreshold] = useState(10);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const summary = useQuery({
    queryKey: ['rpt_inventory_summary', warehouseId, threshold],
    queryFn: () => inventoryService.getSummary(warehouseId, threshold),
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

  return {
    summary,
    lowStock,
    rotation,
    movementTypes,
    warehouseId,
    setWarehouseId,
    threshold,
    setThreshold,
    page,
    setPage,
    pageSize,
  };
}
