import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  fetchQuotationConsumptionsApi,
  saveQuotationConsumptionsApi,
} from "../services/quotationConsumptions.service";
import type {
  QuotationConsumptionMaterial,
  QuotationConsumptionWarehouse,
} from "../types/quotationConsumptions.types";

interface UseQuotationConsumptionsParams {
  quotationId: number | null;
  /** Solo se carga con el modal abierto: es una consulta que cruza recetas. */
  open: boolean;
  onSaved?: () => void;
}

/**
 * El borrador de qué consume un paso.
 *
 * Las casillas y el almacén se editan en local y solo viajan al guardar, como
 * el resto de formularios del módulo. El backend recibe el conjunto entero, así
 * que aquí no hay que llevar la cuenta de qué se marcó y qué se desmarcó.
 */
export const useQuotationConsumptions = ({
  quotationId,
  open,
  onSaved,
}: UseQuotationConsumptionsParams) => {
  const [materials, setMaterials] = useState<QuotationConsumptionMaterial[]>([]);
  const [warehouses, setWarehouses] = useState<QuotationConsumptionWarehouse[]>([]);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // El borrador: lo marcado y el almacén elegido.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [original, setOriginal] = useState<{ ids: number[]; warehouse: number | null }>({
    ids: [],
    warehouse: null,
  });

  const cargar = useCallback(async () => {
    if (quotationId === null) return;
    setLoading(true);
    try {
      const consumos = await fetchQuotationConsumptionsApi(quotationId);

      setMaterials(consumos.materials);
      // Los del proveedor de esta cotización, ya filtrados por el SP.
      setWarehouses(consumos.warehouses);
      setSupplierName(consumos.supplierName);

      const marcados = consumos.materials
        .filter((m) => m.consumedHere)
        .map((m) => m.materialId);

      setSelected(new Set(marcados));
      setWarehouseId(consumos.warehouseId);
      setOriginal({ ids: [...marcados].sort(), warehouse: consumos.warehouseId });
    } catch (error) {
      toastError(error, "No se pudo cargar el consumo de este paso");
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    if (open) void cargar();
  }, [open, cargar]);

  const toggle = useCallback((materialId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) next.delete(materialId);
      else next.add(materialId);
      return next;
    });
  }, []);

  const hasChanges = useMemo(() => {
    const ahora = [...selected].sort();
    return (
      warehouseId !== original.warehouse ||
      ahora.length !== original.ids.length ||
      ahora.some((id, i) => id !== original.ids[i])
    );
  }, [selected, warehouseId, original]);

  // Marcar material sin decir de dónde sale deja el consumo sin poder
  // ejecutarse, así que se pide el almacén en cuanto hay algo marcado.
  const faltaAlmacen = selected.size > 0 && warehouseId === null;

  const guardar = useCallback(async () => {
    if (quotationId === null) return;
    if (faltaAlmacen) {
      toast({
        title: "Elige el almacén en el que trabaja el taller",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await saveQuotationConsumptionsApi({
        quotationId,
        materialIds: [...selected],
        warehouseId,
      });
      toast({ title: "Consumo guardado", variant: "success" });
      onSaved?.();
      await cargar();
    } catch (error) {
      toastError(error, "No se pudo guardar el consumo");
    } finally {
      setSaving(false);
    }
  }, [quotationId, selected, warehouseId, faltaAlmacen, onSaved, cargar]);

  // Sin almacenes no hay dónde descontar, así que no hay nada que declarar.
  // Se distingue de «no hay materiales»: aquí el que falta es el almacén.
  const sinAlmacenes = !loading && warehouses.length === 0;

  return {
    materials,
    warehouses,
    supplierName,
    sinAlmacenes,
    selected,
    warehouseId,
    setWarehouseId,
    toggle,
    loading,
    saving,
    hasChanges,
    faltaAlmacen,
    guardar,
  };
};
