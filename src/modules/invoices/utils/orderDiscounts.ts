// Descuentos globales de la venta (tabla order_discounts).
//
// La venta guarda dos tipos de descuento:
//  - por producto: order_products.product_discount (por unidad), que ya viaja en el
//    descuento de cada línea del comprobante;
//  - globales: filas de order_discounts con monto real (descuentos manuales CUSTOM,
//    porcentajes sobre el subtotal, recargos). Estos afectan orders.total pero no
//    tenían representación en invoice_items, así que la suma de líneas del comprobante
//    quedaba por encima del total de la venta y "Editar comprobante" mostraba un
//    total distinto al que se emitía.
//
// La fila PRO es solo el resumen de los descuentos por producto: se excluye para no
// descontar dos veces. discount_amount viene con signo: negativo descuenta, positivo
// recarga.

export type OrderDiscountRow = {
  code?: string | null;
  discount_amount?: number | string | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const PRODUCT_DISCOUNT_SUMMARY_CODE = "PRO";

// Ajuste global neto de la venta (con signo), sin la fila resumen PRO.
export const sumGlobalOrderDiscounts = (rows: OrderDiscountRow[] | null | undefined): number =>
  round2(
    (rows || [])
      .filter((r) => (r.code || "") !== PRODUCT_DISCOUNT_SUMMARY_CODE)
      .reduce((sum, r) => sum + (Number(r.discount_amount) || 0), 0),
  );

type ProratableItem = {
  quantity: number;
  discount: number;
  igv: number;
  total: number;
};

// Reparte el ajuste global entre las líneas de productos en proporción a su total,
// sumándolo al descuento de cada línea (un recargo lo resta). La última línea absorbe
// el redondeo para que la suma de líneas cuadre al centavo con el total de la venta.
// El envío no se toca: se llama antes de agregar su línea.
export const prorateGlobalDiscount = <T extends ProratableItem>(
  items: T[],
  unitPriceOf: (item: T) => number,
  globalAmount: number,
): T[] => {
  const target = round2(-globalAmount);
  if (!target || items.length === 0) return items;

  const base = items.reduce((sum, i) => sum + i.total, 0);
  if (base <= 0) return items;

  let assigned = 0;
  return items.map((item, idx) => {
    const isLast = idx === items.length - 1;
    const share = isLast ? round2(target - assigned) : round2((target * item.total) / base);
    assigned = round2(assigned + share);

    const discount = round2(item.discount + share);
    const total = round2(item.quantity * unitPriceOf(item) - discount);
    const igv = round2(total - total / 1.18);
    return { ...item, discount, total, igv };
  });
};
