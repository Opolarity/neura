import type { BadgeProps } from "@/components/ui/badge";
import {
  COURIER_NAMES,
  type CashOnDelivery,
  type CourierQuoteOption,
  type CourierShipment,
  type CourierStatusCode,
} from "../types/Couriers.types";
import type { PaymentLike } from "./salePaymentStatus";

export const formatSoles = (value: number) => `S/ ${value.toFixed(2)}`;

export const optionTitle = (option: CourierQuoteOption) =>
  option.deliveryType === "home"
    ? `${COURIER_NAMES[option.courier]} · a domicilio`
    : `${COURIER_NAMES[option.courier]} · agencia ${option.agencyName ?? ""}`.trim();

export const COURIER_STATUS_LABEL: Record<CourierStatusCode, string> = {
  REGISTERED: "Registrado",
  EN_ORIGIN: "En origen",
  IN_TRANSIT: "En tránsito",
  AT_DESTINATION: "En destino",
  OUT_FOR_DELIVERY: "En reparto",
  DELIVERED: "Entregado",
};

export const COURIER_STATUS_VARIANT: Record<CourierStatusCode, BadgeProps["variant"]> = {
  REGISTERED: "pending",
  EN_ORIGIN: "info",
  IN_TRANSIT: "info",
  AT_DESTINATION: "warning",
  OUT_FOR_DELIVERY: "warning",
  DELIVERED: "success",
};

/** Suma de los pagos registrados con importe positivo (los vueltos no cuentan). */
export const getPaidAmount = (payments: PaymentLike[]): number =>
  (payments ?? []).reduce((sum, payment) => {
    const amount =
      typeof payment.amount === "number" ? payment.amount : parseFloat(payment.amount ?? "");
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);

/** Lo que falta pagar de la venta: es el monto a cobrar contra entrega. */
export const getPendingBalance = (payments: PaymentLike[], total: number): number =>
  Math.max(0, Math.round((total - getPaidAmount(payments)) * 100) / 100);

/** Texto del rótulo: «CONTRA ENTREGA · COBRAR S/ X» o «PAGADO · NO COBRAR». */
export const paymentNotice = (cod: CashOnDelivery | null, balance: number): string =>
  cod?.enabled && balance > 0
    ? `CONTRA ENTREGA · COBRAR ${formatSoles(balance)}`
    : balance > 0
      ? `SALDO PENDIENTE ${formatSoles(balance)} · NO COBRAR`
      : "PAGADO · NO COBRAR";

/** Texto del rótulo para el flete; vacío si la venta no va con courier. */
export const freightNotice = (shipment: CourierShipment | null): string =>
  !shipment
    ? ""
    : shipment.freightPayer === "customer"
      ? "FLETE: PAGA EL DESTINATARIO"
      : "FLETE: PAGADO POR LA TIENDA";

/** Pasos del seguimiento, en orden. "En reparto" cuenta como el paso de destino. */
export const COURIER_STEPS: { codes: CourierStatusCode[]; label: string }[] = [
  { codes: ["REGISTERED"], label: "Registrado" },
  { codes: ["EN_ORIGIN"], label: "En origen" },
  { codes: ["IN_TRANSIT"], label: "En tránsito" },
  { codes: ["AT_DESTINATION", "OUT_FOR_DELIVERY"], label: "En destino" },
  { codes: ["DELIVERED"], label: "Entregado" },
];

export const courierStepIndex = (code: CourierStatusCode | null): number =>
  code ? COURIER_STEPS.findIndex((step) => step.codes.includes(code)) : -1;

/**
 * Clave de recojo en agencia: 4 dígitos. Shalom rechaza las consecutivas
 * (1234, 4321); se evitan también para Olva.
 */
export const isValidPickupKey = (key: string): boolean => {
  if (!/^\d{4}$/.test(key)) return false;
  const d = key.split("").map(Number);
  const asc = d.every((n, i) => i === 0 || n === d[i - 1] + 1);
  const desc = d.every((n, i) => i === 0 || n === d[i - 1] - 1);
  return !asc && !desc;
};

export const generatePickupKey = (): string => {
  for (;;) {
    const key = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    if (isValidPickupKey(key)) return key;
  }
};
