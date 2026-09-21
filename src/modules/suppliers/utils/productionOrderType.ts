import { BadgeProps } from "@/components/ui/badge";
import { ProductionOrderType } from "../types/productionOrders.types";

/**
 * Cómo se rotula y se pinta el ORIGEN de una orden (distinto del estado).
 *
 * Vive aquí para que la fila del listado y la cabecera del detalle no puedan
 * decir cosas distintas del mismo origen. Colores según los tokens de la casa:
 * `warning` para la consignación (viene de fuera, se trata aparte) y
 * `secondary` para la producción propia.
 */
const LABELS: Record<
  ProductionOrderType,
  { label: string; variant: BadgeProps["variant"] }
> = {
  CONSIGNMENT: { label: "Consignación", variant: "warning" },
  PRODUCTION: { label: "Producción", variant: "secondary" },
};

/**
 * Los orígenes, para poblar el filtro del listado. Sale de aquí y no de una
 * lista aparte para que filtrar por un origen y verlo no puedan separarse.
 */
export const PRODUCTION_ORDER_TYPES: ProductionOrderType[] = [
  "PRODUCTION",
  "CONSIGNMENT",
];

/**
 * Etiqueta + variante de un origen. Devuelve `null` para las órdenes sin type
 * (históricas anteriores a la columna): la celda no pinta badge en ese caso.
 */
export const productionOrderTypeBadge = (type: ProductionOrderType | null) =>
  type ? LABELS[type] ?? null : null;
