import { BadgeProps } from "@/components/ui/badge";
import { ProductionOrderStatus } from "../types/productionOrders.types";

/**
 * Cómo se rotula y se pinta el estado de una orden.
 *
 * Vive aquí y no en cada pantalla para que la fila del listado y la cabecera
 * del detalle no puedan decir cosas distintas del mismo estado.
 *
 * Los colores siguen los tokens de la casa: `pending` para lo que está en
 * espera, `info` para lo que va en marcha sin ser una alerta, y `success` para
 * lo terminado.
 */
const LABELS: Record<
  ProductionOrderStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  DRAFT: { label: "Borrador", variant: "pending" },
  IN_PROGRESS: { label: "En progreso", variant: "info" },
  DONE: { label: "Culminado", variant: "success" },
};

/**
 * Los estados, en el orden en que avanza una orden.
 *
 * Sale de aquí y no de una lista aparte para que filtrar por «En progreso» y
 * ver «En progreso» no puedan separarse.
 */
export const PRODUCTION_ORDER_STATUSES: ProductionOrderStatus[] = [
  "DRAFT",
  "IN_PROGRESS",
  "DONE",
];

export const productionOrderStatusBadge = (status: ProductionOrderStatus) =>
  // Un código que el ERP no conozca no debería dejar la celda en blanco: se
  // trata como borrador, que es el estado más conservador de los tres.
  LABELS[status] ?? LABELS.DRAFT;
