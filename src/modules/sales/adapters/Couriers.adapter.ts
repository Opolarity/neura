// Traduce las respuestas de courier-settings y order-courier al modelo de la UI.
import type {
  CashOnDelivery,
  CourierCatalog,
  CourierCode,
  CourierEvent,
  CourierQuoteOption,
  CourierSettings,
  CourierShipment,
  CourierStatusCode,
  FreightPayer,
} from "../types/Couriers.types";

export interface CourierSettingsResponse {
  code: CourierCode;
  active: boolean;
  methodId: number | null;
  methodName: string | null;
  originId: string | null;
  originLabel: string | null;
  packageId: string | null;
  shalomUsername?: string | null;
  shalomConnected?: boolean;
}

export const adaptCourierSettings = (row: CourierSettingsResponse): CourierSettings => ({
  code: row.code,
  enabled: row.active,
  methodId: row.methodId ?? null,
  methodName: row.methodName ?? null,
  originId: row.originId,
  originLabel: row.originLabel,
  packageId: row.packageId,
  ...(row.code === "OWN-SHALOM"
    ? { shalomUsername: row.shalomConnected ? (row.shalomUsername ?? "Cuenta conectada") : null }
    : {}),
});

export const adaptCourierCatalog = (data: CourierCatalog | null | undefined): CourierCatalog => ({
  origins: data?.origins ?? [],
  packages: data?.packages ?? [],
});

interface QuoteOptionResponse {
  id: string;
  courier: CourierCode;
  deliveryType: "agency" | "home";
  agencyCode: string | null;
  agencyName: string | null;
  agencyAddress: string | null;
  cost: number;
  leadTime: string;
}

export interface CourierQuoteResponse {
  courier: CourierCode;
  options: QuoteOptionResponse[];
  error: string | null;
}

export const adaptQuoteOption = (o: QuoteOptionResponse): CourierQuoteOption => ({
  id: o.id,
  courier: o.courier,
  deliveryType: o.deliveryType,
  agencyCode: o.agencyCode,
  agencyName: o.agencyName,
  agencyAddress: o.agencyAddress,
  cost: Number(o.cost),
  leadTime: o.leadTime ?? "",
});

interface ShipmentResponse {
  courier: CourierCode;
  deliveryType: "agency" | "home";
  agencyCode: string | null;
  agencyName: string | null;
  agencyAddress: string | null;
  trackingNumber: string | null;
  trackingCode: string | null;
  pickupKey: string | null;
  statusCode: CourierStatusCode | null;
  statusText: string | null;
  events: CourierEvent[];
  courierCost: number | null;
  freightPayer: FreightPayer | null;
  leadTime: string | null;
  paymentUrl: string | null;
  cancellable: boolean;
  trackingError: string | null;
}

export interface OrderCourierResponse {
  orderId: number;
  cashOnDelivery: boolean;
  shipment: ShipmentResponse | null;
}

export interface OrderCourier {
  cashOnDelivery: CashOnDelivery;
  shipment: CourierShipment | null;
}

export const adaptOrderCourier = (data: OrderCourierResponse): OrderCourier => {
  const s = data.shipment;
  return {
    cashOnDelivery: { enabled: data.cashOnDelivery === true },
    shipment: s
      ? {
          orderId: data.orderId,
          option: {
            id: `${s.courier}:${s.agencyCode ? `agency:${s.agencyCode}` : "home"}`,
            courier: s.courier,
            deliveryType: s.deliveryType,
            agencyCode: s.agencyCode,
            agencyName: s.agencyName,
            agencyAddress: s.agencyAddress,
            cost: s.courierCost != null ? Number(s.courierCost) : null,
            leadTime: s.leadTime ?? "",
          },
          // Sin guía, quién paga lo decide el formulario (ver useCourierShipment).
          freightPayer: s.freightPayer ?? "store",
          trackingNumber: s.trackingNumber,
          trackingCode: s.trackingCode,
          pickupKey: s.pickupKey,
          statusCode: s.statusCode,
          events: s.events ?? [],
          cancellable: s.cancellable === true,
          paymentUrl: s.paymentUrl,
          trackingError: s.trackingError,
        }
      : null,
  };
};
