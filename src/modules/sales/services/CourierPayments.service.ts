// Pagos de las guías de Olva y Shalom vía la edge function courier-payments.
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type { CourierCode, CourierPaymentsSummary } from "../types/Couriers.types";

interface Envelope<T> {
  success: boolean;
  data: T;
}

const call = async <T>(body: Record<string, unknown>): Promise<T> =>
  (await invokeFunction<Envelope<T>>("courier-payments", { body })).data;

/** Guías del courier entre dos días de Lima ("YYYY-MM-DD"). */
export const getCourierPayments = (courier: CourierCode, from: string, to: string) =>
  call<CourierPaymentsSummary>({ action: "list", courier, from, to });

/** Olva: link de PagoEfectivo vigente (o uno nuevo si venció). */
export const getOlvaPaymentLink = async (orderId: number) =>
  (await call<{ url: string }>({ action: "payment_link", orderId })).url;

export const markCourierGuidesPaid = (courier: CourierCode, orderIds: number[]) =>
  call<{ updated: number }>({ action: "mark_paid", courier, orderIds });

export const unmarkCourierGuidesPaid = (courier: CourierCode, orderIds: number[]) =>
  call<{ updated: number }>({ action: "unmark_paid", courier, orderIds });
