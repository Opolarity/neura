// Tipos del POS lateral de la bandeja ("Pedido").
//
// El pedido se crea por el MISMO camino que "Añadir venta" (edge create-order):
// estos tipos son el borrador que arma el vendedor mientras chatea, y el
// servicio lo traduce al CreateOrderRequest de ventas.

import type {
  City,
  Country,
  DocumentType,
  Neighborhood,
  PaymentMethod,
  PriceList,
  SaleType,
  ShippingCost,
  Situation,
  State,
} from "@/modules/sales/types";

/** Una prenda del carrito: una variación (talla/color) de un producto. */
export interface QuickOrderLine {
  variationId: number;
  productId: number;
  productTitle: string;
  sku: string;
  imageUrl: string | null;
  /** Talla, color… tal como los nombra el catálogo. */
  terms: string[];
  /** Precio de lista; las reglas de precio parten de acá. */
  originalPrice: number;
  /** Precio unitario final: el de las reglas de precio, o el que puso el vendedor. */
  price: number;
  /** El vendedor fijó el precio a mano: las reglas ya no lo tocan. */
  manualPrice: boolean;
  /** Descuento por unidad, como en Añadir venta. Se resta del precio. */
  discountAmount: number;
  quantity: number;
  /** Stock al momento de agregarla: tope de la cantidad. */
  maxStock: number;
  /** Tipo de inventario del que sale (order_products.stock_type_id). */
  stockTypeId: number;
  /** Regalo de una regla de precio: va a S/ 0 y no se edita. */
  isGift?: boolean;
}

export interface QuickOrderCustomer {
  documentTypeId: number | null;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** Ya existe en accounts: create-order no la vuelve a crear. */
  accountId: number | null;
  /** Usuario (profiles.id) de la cuenta: las reglas de precio por cliente lo usan. */
  userId: string | null;
}

export interface QuickOrderShipping {
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  neighborhoodId: number | null;
  /** shipping_costs.id elegido (lo que ventas llama shippingMethod). */
  shippingCostId: number | null;
  cost: number;
  address: string;
  reference: string;
  receptionPerson: string;
  receptionPhone: string;
}

/** Hasta cuántos comprobantes (imagen o PDF) se adjuntan por pago o vuelto, como en Añadir venta. */
export const MAX_VOUCHERS = 3;

export interface QuickOrderPayment {
  /** Solo para la UI (key de la lista). */
  id: string;
  paymentMethodId: number | null;
  /** Cuenta de destino: la del método, o la que elige el vendedor si el método no trae. */
  businessAccountId: number | null;
  amount: number | null;
  operationCode: string;
  /** Comprobantes del pago (imagen o PDF). Se suben recién cuando la orden existe. */
  vouchers: File[];
}

/** Vuelto entregado: mismos datos que un pago, sin código de operación. */
export type QuickOrderChange = Omit<QuickOrderPayment, "operationCode">;

/** Descuento (monto negativo) o recargo (positivo) puesto a mano. */
export interface QuickOrderManualDiscount {
  id: string;
  name: string;
  amount: number;
}

export interface QuickOrderDraft {
  customer: QuickOrderCustomer;
  priceListId: number | null;
  saleTypeId: number | null;
  situationId: number | null;
  /** Tipo de inventario con el que se buscan y agregan productos. */
  stockTypeId: number | null;
  lines: QuickOrderLine[];
  /** Descuentos que devolvieron las reglas de precio (montos negativos). */
  ruleDiscounts: { name: string; amount: number; code: string }[];
  /** Mensajes de las reglas aplicadas ("2x1 en polos"…), para que el vendedor sepa por qué cambió el precio. */
  appliedRules: { name: string; message: string }[];
  manualDiscounts: QuickOrderManualDiscount[];
  withShipping: boolean;
  shipping: QuickOrderShipping;
  withPayment: boolean;
  payments: QuickOrderPayment[];
  changeEntries: QuickOrderChange[];
  notes: string;
}

/** Catálogos que el panel necesita, cargados una vez por sesión. */
export interface QuickOrderCatalogs {
  documentTypes: DocumentType[];
  saleTypes: SaleType[];
  priceLists: PriceList[];
  paymentMethods: PaymentMethod[];
  paymentMethodSaleTypes: { paymentMethodId: number; saleTypeId: number }[];
  situations: Situation[];
  countries: Country[];
  states: State[];
  cities: City[];
  neighborhoods: Neighborhood[];
  shippingCosts: ShippingCost[];
  /** Cuentas activas, para los métodos de pago que no traen una propia. */
  businessAccounts: { id: number; name: string }[];
  /** Tipo de inventario por defecto del negocio. */
  stockTypeId: number;
  /** Todos los tipos de inventario activos: el selector solo aparece si hay más de uno. */
  stockTypes: { id: number; name: string }[];
}

/** Resultado de buscar prendas: una fila por variación con stock. */
export interface QuickOrderProduct {
  productId: number;
  productTitle: string;
  variationId: number;
  sku: string;
  imageUrl: string | null;
  stock: number;
  terms: { id: number; name: string }[];
  prices: { priceListId: number; price: number; salePrice: number | null }[];
}

export interface QuickOrderTotals {
  subtotal: number;
  /** Reglas de precio + descuentos manuales (negativo descuenta, positivo recarga). */
  discount: number;
  shipping: number;
  total: number;
  items: number;
  /** Suma de los pagos registrados. */
  paid: number;
  /** Lo que falta cobrar. */
  pending: number;
  /** Vuelto calculado: lo pagado por encima del total. */
  change: number;
  /** Suma de los vueltos ya registrados. */
  changeGiven: number;
}

export interface QuickOrderResult {
  orderId: number;
  total: number;
  paid: number;
  /** El texto del resumen para mandarle al cliente por WhatsApp. */
  summary: string;
  /** La orden se creó pero la captura no se pudo adjuntar. */
  voucherWarning: string | null;
}

/** Una página de la búsqueda de productos. */
export interface QuickOrderProductPage {
  rows: QuickOrderProduct[];
  total: number;
}
