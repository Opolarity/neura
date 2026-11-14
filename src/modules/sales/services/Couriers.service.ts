// Couriers propios (Olva y Shalom) vía las edge functions courier-settings y
// order-courier. Las API keys viven en el backend; aquí solo viaja la venta.
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import {
  adaptCourierCatalog,
  adaptCourierSettings,
  adaptOrderCourier,
  adaptQuoteOption,
  type CourierQuoteResponse,
  type CourierSettingsResponse,
  type OrderCourier,
  type OrderCourierResponse,
} from "../adapters/Couriers.adapter";
import type {
  CourierCatalog,
  CourierCode,
  CourierDestination,
  CourierQuoteOption,
  CourierSettings,
  FreightPayer,
} from "../types/Couriers.types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

const settingsCall = async <T>(body: Record<string, unknown>): Promise<T> =>
  (await invokeFunction<Envelope<T>>("courier-settings", { body })).data;

const orderCall = async <T>(orderId: number, body: Record<string, unknown>): Promise<T> =>
  (await invokeFunction<Envelope<T>>("order-courier", { body: { ...body, orderId } })).data;

// ---- Configuración (métodos de envío OWN-OLVA / OWN-SHALOM) ----------------------

export async function getCourierSettings(): Promise<CourierSettings[]> {
  const rows = await settingsCall<CourierSettingsResponse[]>({ action: "list" });
  return rows.map(adaptCourierSettings);
}

export async function getCourierCatalog(code: CourierCode): Promise<CourierCatalog> {
  return adaptCourierCatalog(await settingsCall<CourierCatalog>({ action: "catalog", code }));
}

/** La contraseña solo se reenvía al login de Shalom Pro: no se guarda. */
export async function connectShalomPro(username: string, password: string): Promise<void> {
  await settingsCall({ action: "connect_shalom", username, password });
}

export async function disconnectShalomPro(): Promise<void> {
  await settingsCall({ action: "disconnect_shalom" });
}

// ---- Venta ----------------------------------------------------------------------

export async function getOrderCourier(orderId: number): Promise<OrderCourier> {
  return adaptOrderCourier(await orderCall<OrderCourierResponse>(orderId, { action: "get" }));
}

/** Cotiza un courier. Si el courier respondió con error, lo lanza para mostrarlo. */
export async function quoteOrderShipping(
  orderId: number,
  destination: CourierDestination,
  couriers: CourierCode[],
): Promise<CourierQuoteOption[]> {
  const results = await orderCall<CourierQuoteResponse[]>(orderId, {
    action: "quote",
    couriers,
    destination,
  });
  const failed = results.find((r) => r.error && r.options.length === 0);
  if (failed && results.length === 1) throw new Error(failed.error!);
  return results.flatMap((r) => r.options.map(adaptQuoteOption));
}

export async function applyCourierQuote(
  orderId: number,
  option: CourierQuoteOption,
): Promise<OrderCourier> {
  return adaptOrderCourier(
    await orderCall<OrderCourierResponse>(orderId, {
      action: "apply",
      courier: option.courier,
      agencyCode: option.deliveryType === "agency" ? option.agencyCode : null,
    }),
  );
}

export interface CreateShipmentResult extends OrderCourier {
  /** Rótulo PDF (base64) si el courier lo devuelve al crear. */
  label: string | null;
}

/**
 * Genera la guía real en el courier (tiene costo). Shalom recibe la clave como
 * `clave` y Olva como `pin`; solo aplica a entregas en agencia.
 */
export async function createCourierShipment(
  orderId: number,
  pickupKey: string | null,
  freightPayer: FreightPayer,
): Promise<CreateShipmentResult> {
  const data = await orderCall<OrderCourierResponse & { label?: string | null }>(orderId, {
    action: "create",
    pickupKey,
    freightPayer,
  });
  return { ...adaptOrderCourier(data), label: data.label ?? null };
}

export async function refreshCourierTracking(orderId: number): Promise<OrderCourier> {
  return adaptOrderCourier(await orderCall<OrderCourierResponse>(orderId, { action: "track" }));
}

export async function getCourierLabel(orderId: number): Promise<{ fileName: string; base64: string }> {
  return orderCall(orderId, { action: "label" });
}

export async function saveCashOnDelivery(orderId: number, enabled: boolean): Promise<OrderCourier> {
  return adaptOrderCourier(await orderCall<OrderCourierResponse>(orderId, { action: "cod", enabled }));
}

/** Shalom: anula la guía mientras sigue pendiente. */
export async function cancelCourierShipment(orderId: number): Promise<OrderCourier> {
  return adaptOrderCourier(await orderCall<OrderCourierResponse>(orderId, { action: "cancel" }));
}

/** Quita el courier de la venta. Con guía de Olva, la guía queda en Olva. */
export async function removeCourierShipment(orderId: number): Promise<OrderCourier> {
  return adaptOrderCourier(await orderCall<OrderCourierResponse>(orderId, { action: "unlink" }));
}
