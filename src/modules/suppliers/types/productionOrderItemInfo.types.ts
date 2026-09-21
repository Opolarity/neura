/**
 * Por qué pasos del recorrido pasa cada ítem de la orden.
 *
 * El puente es `production_order_item_info`, y dice UNA cosa: esta prenda
 * recorre este paso. Marcar la celda la vincula; no marcarla, no. Eso es lo
 * que permite repartir el costo solo entre las prendas que atravesaron cada
 * servicio — un pantalón que no pasa por estampado no lo paga.
 *
 * Llevó `quantity` y `bad_quantity` para la merma por prenda y por proceso;
 * se retiraron en 202609110001.
 */

/** Fila del vínculo ítem ↔ paso, tal como la espera el SP. */
export interface ItemInfoPayload {
  production_order_item_id: number;
  production_order_info_id: number;
}

/** Un paso del recorrido de la orden. */
export interface ItemInfoStep {
  productionOrderInfoId: number;
  order: number;
  processName: string | null;
  processGroupName: string | null;
  serviceDescription: string | null;
}

export interface ProductionOrderItemInfo {
  productionOrderId: number;
  productionOrderName: string;
  items: {
    id: number;
    name: string;
    planned: number;
    steps: ItemInfoStep[];
  }[];
  /** Todos los pasos de la orden: las columnas de la matriz. */
  steps: ItemInfoStep[];
}
