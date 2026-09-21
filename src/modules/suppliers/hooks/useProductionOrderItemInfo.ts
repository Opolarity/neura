import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  itemInfoApi,
  updateItemInfoApi,
} from "../services/productionOrderItemInfo.service";
import {
  ItemInfoPayload,
  ProductionOrderItemInfo,
} from "../types/productionOrderItemInfo.types";

/** Un paso de la orden, aplanado para las columnas de la matriz. */
export interface FlatStep {
  id: number;
  order: number;
  processName: string | null;
  serviceDescription: string | null;
}

const cellKey = (itemId: number, stepId: number) => `${itemId}:${stepId}`;

interface UseProductionOrderItemInfoOptions {
  productionOrderId: number | null;
  /** El diálogo solo carga cuando está abierto. */
  open: boolean;
  onSaved?: () => void;
}

export const useProductionOrderItemInfo = ({
  productionOrderId,
  open,
  onSaved,
}: UseProductionOrderItemInfoOptions) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProductionOrderItemInfo | null>(null);
  /** Solo las celdas marcadas están en el conjunto. */
  const [cells, setCells] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!open || productionOrderId === null) return;

    try {
      setLoading(true);
      const detail = await itemInfoApi(productionOrderId);
      setData(detail);

      const next = new Set<string>();
      detail.items.forEach((item) => {
        item.steps.forEach((step) => {
          next.add(cellKey(item.id, step.productionOrderInfoId));
        });
      });
      setCells(next);
    } catch (error: any) {
      toast({ title: "Error al cargar los procesos del ítem: " + error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [open, productionOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  const items = data?.items ?? [];

  /**
   * Columnas de la matriz: los pasos de la orden. Vienen TODOS aunque ningún
   * ítem esté vinculado todavía — que es justo lo que hace falta para poder
   * vincularlos.
   */
  const steps: FlatStep[] = useMemo(
    () =>
      (data?.steps ?? [])
        .map((s) => ({
          id: s.productionOrderInfoId,
          order: s.order,
          processName: s.processName,
          serviceDescription: s.serviceDescription,
        }))
        .sort((a, b) => a.order - b.order || a.id - b.id),
    [data]
  );

  const isChecked = useCallback(
    (itemId: number, stepId: number) => cells.has(cellKey(itemId, stepId)),
    [cells]
  );

  const toggle = useCallback((itemId: number, stepId: number) => {
    setCells((prev) => {
      const next = new Set(prev);
      const key = cellKey(itemId, stepId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (productionOrderId === null) return;

    const rows: ItemInfoPayload[] = [];
    items.forEach((item) => {
      steps.forEach((step) => {
        if (!cells.has(cellKey(item.id, step.id))) return;
        rows.push({
          production_order_item_id: item.id,
          production_order_info_id: step.id,
        });
      });
    });

    try {
      setSaving(true);
      await updateItemInfoApi(productionOrderId, rows);
      toast({ title: "Procesos del ítem guardados", variant: "success" });
      await load();
      onSaved?.();
    } catch (error: any) {
      toast({ title: "Error al guardar: " + error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    items,
    steps,
    isChecked,
    toggle,
    handleSave,
  };
};
