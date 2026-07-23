import type { InvoiceItemForm } from "../types/Invoices.types";

// El costo de envío se factura como un item más del comprobante (invoice_items es la
// única fuente de verdad: lo que se ve en la edición es lo que se imprime y se emite).
export const SHIPPING_ITEM_DESCRIPTION = "Costo de envío";
export const SHIPPING_MEASUREMENT_UNIT = "ZZ";

// El costo de envío del pedido ya viene con IGV incluido, igual que el resto de items.
export const calcShippingAmounts = (shippingCost: number) => {
  const total = Math.round(shippingCost * 100) / 100;
  const igv = Math.round((shippingCost - shippingCost / 1.18) * 100) / 100;
  return { total, igv };
};

export const hasShippingItem = (items: { description?: string | null }[]): boolean =>
  items.some((item) => item.description === SHIPPING_ITEM_DESCRIPTION);

// Fila de envío para el formulario de comprobante. Devuelve null si el pedido no tiene envío.
export const buildShippingFormItem = (shippingCost: unknown): InvoiceItemForm | null => {
  const cost = Number(shippingCost) || 0;
  if (cost <= 0) return null;

  const { total, igv } = calcShippingAmounts(cost);
  return {
    id: crypto.randomUUID(),
    description: SHIPPING_ITEM_DESCRIPTION,
    quantity: 1,
    measurementUnit: SHIPPING_MEASUREMENT_UNIT,
    unitPrice: cost,
    discount: 0,
    igv,
    total,
  };
};
