import { useEffect, useState } from "react";
import { ProductionOrderCost, productionOrderCostApi } from "../services/productionOrderCost.service";

/**
 * El costo total de producir la orden. Si no carga, la pizarra sigue sin la
 * fila en vez de fallar. Se relee con cada cambio de la orden (`reloadKey`).
 */
export const useProductionOrderCost = (productionOrderId: number | null, reloadKey: number) => {
  const [cost, setCost] = useState<ProductionOrderCost | null>(null);

  useEffect(() => {
    if (productionOrderId === null) return;
    let vigente = true;
    productionOrderCostApi(productionOrderId)
      .then((data) => vigente && setCost(data))
      .catch(() => vigente && setCost(null));
    return () => {
      vigente = false;
    };
  }, [productionOrderId, reloadKey]);

  return cost;
};
