import { useCallback, useEffect, useState } from "react";
import { toastError } from "@/shared/utils/toastError";
import { productionOrderPurchasesApi } from "../services/productionOrderPurchases.service";
import { ProductionOrderPurchase } from "../types/productionOrderPurchases.types";

/**
 * Las compras de material de una orden.
 *
 * `reloadKey` es lo que hace que la compra recién hecha aparezca sola: el
 * diálogo de compra ya avisa al panel, y el panel sube el número.
 */
export const useProductionOrderPurchases = (
  productionOrderId: number | null,
  reloadKey = 0,
) => {
  const [purchases, setPurchases] = useState<ProductionOrderPurchase[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (productionOrderId === null) return;

    try {
      setLoading(true);
      setPurchases(await productionOrderPurchasesApi(productionOrderId));
    } catch (error) {
      toastError(error, "No se pudieron cargar las compras de la orden");
    } finally {
      setLoading(false);
    }
    // reloadKey entra a proposito: es el disparador de la recarga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionOrderId, reloadKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { purchases, loading, reload: load };
};
