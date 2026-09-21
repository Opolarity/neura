import { BadgeProps } from "@/components/ui/badge";
import { ProductionItemStatus } from "../types/productionPlan.types";

/**
 * Cómo se rotula y se pinta el estado de una prenda del plan.
 *
 * Mismos tokens que el estado de la orden —`pending` para lo que espera, `info`
 * para lo que va en marcha, `success` para lo terminado— para que las dos
 * columnas de la misma fila se lean con el mismo código de color.
 */
const LABELS: Record<
  ProductionItemStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  PENDING: { label: "Pendiente", variant: "pending" },
  IN_PROGRESS: { label: "En progreso", variant: "info" },
  DONE: { label: "Culminado", variant: "success" },
};

export const productionItemStatusBadge = (status: ProductionItemStatus) =>
  // Un código que el ERP no conozca no debería dejar la celda en blanco: se
  // trata como pendiente, que es el estado más conservador.
  LABELS[status] ?? LABELS.PENDING;

/** Las opciones del filtro, en el orden en que avanza una prenda. */
export const PRODUCTION_ITEM_STATUSES: ProductionItemStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
];
