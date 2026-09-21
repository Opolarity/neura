import { ProductionOrder } from "./productionOrders.types";

/**
 * Un servicio de cotización puede vincularse a una orden de producción
 * existente. A diferencia del material, no hay alta inline: las órdenes
 * tienen su propia pantalla.
 */
export interface ProductionOrderLinkValue {
  linked: boolean;
  productionOrderId: number | null;
  productionOrderName: string | null;
}

export const emptyProductionOrderLink = (): ProductionOrderLinkValue => ({
  linked: false,
  productionOrderId: null,
  productionOrderName: null,
});

export const selectProductionOrder = (
  order: ProductionOrder
): ProductionOrderLinkValue => ({
  linked: true,
  productionOrderId: order.id,
  productionOrderName: order.name,
});

/** Motivo por el que el vínculo no está completo, o null si es válido. */
export const productionOrderLinkError = (
  value: ProductionOrderLinkValue
): string | null => {
  if (value.linked && value.productionOrderId === null) {
    return "Selecciona la orden de producción a vincular";
  }
  return null;
};

/** Parte del payload que entiende el backend (`production_order_id`). */
export const productionOrderLinkPayload = (value: ProductionOrderLinkValue) => ({
  production_order_id: value.linked ? value.productionOrderId : null,
});
