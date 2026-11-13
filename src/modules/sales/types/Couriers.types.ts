// Couriers conectados por API (Shalom y Olva, APIs propias de Neura).
export type CourierCode = "OWN-OLVA" | "OWN-SHALOM";

export const COURIER_NAMES: Record<CourierCode, string> = {
  "OWN-OLVA": "Olva",
  "OWN-SHALOM": "Shalom",
};

export interface CourierOption {
  value: string;
  label: string;
  hint?: string;
}

export interface CourierSettings {
  code: CourierCode;
  /** El método de envío del courier existe. */
  enabled: boolean;
  /** Método de envío OWN-OLVA / OWN-SHALOM. */
  methodId: number | null;
  methodName: string | null;
  /** Olva: sede (headquarter); Shalom: agencia de origen (ter_id). */
  originId: string | null;
  /** Olva: talla (size_id); Shalom: contenido (PAQUETE S, …). */
  packageId: string | null;
  /** Nombre del origen guardado (para mostrarlo sin consultar el catálogo). */
  originLabel?: string | null;
  /** Solo Shalom: cuenta Shalom Pro conectada. */
  shalomUsername?: string | null;
}

export interface CourierCatalog {
  origins: CourierOption[];
  packages: CourierOption[];
}

export type CourierDeliveryType = "agency" | "home";

export interface CourierQuoteOption {
  id: string;
  courier: CourierCode;
  deliveryType: CourierDeliveryType;
  /** Olva: código de agencia; Shalom: ter_id. Null = a domicilio. */
  agencyCode: string | null;
  agencyName: string | null;
  agencyAddress: string | null;
  cost: number;
  leadTime: string;
}

export type CourierStatusCode =
  | "REGISTERED"
  | "EN_ORIGIN"
  | "IN_TRANSIT"
  | "AT_DESTINATION"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface CourierEvent {
  statusCode: CourierStatusCode;
  statusText: string;
  at: string | null;
}

/** Quién paga el flete del courier. */
export type FreightPayer = "store" | "customer";

/** Contra entrega: el cliente paga el saldo de la venta al recibir. */
export interface CashOnDelivery {
  enabled: boolean;
}

export interface CourierShipment {
  orderId: number;
  /** El costo es null si el courier no respondió al recotizar. */
  option: Omit<CourierQuoteOption, "cost"> & { cost: number | null };
  freightPayer: FreightPayer;
  trackingNumber: string | null;
  /** Shalom: código de seguridad para rastrear; Olva: año de la guía. */
  trackingCode: string | null;
  /** Clave de 4 dígitos para recoger en agencia. */
  pickupKey: string | null;
  statusCode: CourierStatusCode | null;
  events: CourierEvent[];
  /** Shalom: la guía sigue pendiente y se puede anular. */
  cancellable: boolean;
  /** Olva con pago online: link para pagar el flete. */
  paymentUrl: string | null;
  /** El rastreo falló al abrir la venta (la guía sigue ahí). */
  trackingError: string | null;
}

export interface CourierDestination {
  stateName?: string;
  cityName?: string;
  neighborhoodName?: string;
  address?: string;
  reference?: string;
  /** Ids de la ubicación: el backend revisa las zonas del método courier. */
  countryId?: number;
  stateId?: number;
  cityId?: number;
  neighborhoodId?: number;
}

// ---- Pagos de guías (Envíos › método courier › Pagos) ------------------------

/** paid = pagada; pending = la paga la tienda y falta; customer = la paga el destinatario. */
export type CourierGuidePaymentStatus = "paid" | "pending" | "customer";

export interface CourierGuidePayment {
  orderId: number;
  orderCode: string | null;
  customer: string | null;
  trackingNumber: string;
  destination: string | null;
  createdAt: string;
  cost: number | null;
  status: CourierGuidePaymentStatus;
  paidAt: string | null;
  /** Pago confirmado por Olva (PagoEfectivo): no se puede desmarcar. */
  paidByCourier: boolean;
  /** No se pudo consultar a Olva el estado del pago. */
  stateError: boolean;
}

export interface CourierPaymentsSummary {
  guides: CourierGuidePayment[];
  totals: { total: number; paid: number; pending: number };
}
