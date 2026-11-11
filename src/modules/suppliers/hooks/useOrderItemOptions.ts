import { useCallback, useEffect, useState } from "react";
import { productionOrderProcessesApi } from "../services/productionOrderProcesses.service";
import { ProductionOrderItemOption } from "../types/productionOrderProcesses.types";

/**
 * Las prendas de la OP como las pide «Encargar al taller»
 * (QuotationFromProcessDialog): de cada una elegida nace su servicio. Con
 * null no carga nada.
 */
export const useOrderItemOptions = (productionOrderId: number | null) => {
  const [items, setItems] = useState<ProductionOrderItemOption[]>([]);

  const load = useCallback(async () => {
    if (productionOrderId === null) return;
    try {
      const data = await productionOrderProcessesApi(productionOrderId);
      setItems(data.items);
    } catch {
      // Sin prendas el diálogo no deja encargar: no hay nada más que avisar.
      setItems([]);
    }
  }, [productionOrderId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, reload: load };
};
