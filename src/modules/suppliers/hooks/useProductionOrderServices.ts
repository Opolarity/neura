import { useCallback, useEffect, useState } from "react";
import { toastError } from "@/shared/utils/toastError";
import { productionOrderProcessesApi } from "../services/productionOrderProcesses.service";
import {
  ProductionOrderItemOption,
  ServiceProcesses,
} from "../types/productionOrderProcesses.types";

/**
 * Los servicios de taller de una orden, para listarlos e imprimirlos.
 *
 * Sale del mismo endpoint que la ruta —`sp_get_production_order_processes` ya
 * devuelve cada servicio con su proveedor, su cantidad pedida y su precio— y
 * no de uno nuevo: es exactamente la misma pregunta hecha desde otro sitio de
 * la pantalla.
 *
 * A diferencia de `useProductionOrderProcesses`, este no carga los catálogos de
 * procesos y grupos: aquí no se edita nada, solo se lee y se imprime.
 */
export const useProductionOrderServices = (
  productionOrderId: number | null,
  reloadKey = 0,
) => {
  const [services, setServices] = useState<ServiceProcesses[]>([]);
  const [items, setItems] = useState<ProductionOrderItemOption[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (productionOrderId === null) return;

    try {
      setLoading(true);
      const detail = await productionOrderProcessesApi(productionOrderId);
      // Un servicio con material es una COMPRA, y esa se lista en la explosión
      // con su orden de compra. Aquí van los de taller.
      setServices(detail.services.filter((s) => s.materialId === null));
      setItems(detail.items);
    } catch (error) {
      toastError(error, "No se pudieron cargar los servicios de la orden");
    } finally {
      setLoading(false);
    }
    // reloadKey entra a propósito: es el disparador de la recarga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionOrderId, reloadKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { services, items, loading, reload: load };
};
