import { CutFabricInput } from "./cutFabric.types";

/**
 * Órdenes de corte (O/C) de la OP: nacen del corte realizado, que se registra
 * con «Iniciar corte» por estilo + color. Varias pueden ser del mismo color
 * —otro tono, otro destino—.
 */

/** Una talla de la OP para un atributo: lo pedido, lo ya cortado y lo que falta. */
export interface CutAttributeItem {
  productionOrderItemId: number;
  label: string;
  sizeName: string | null;
  ordered: number;
  /** Lo pedido que ya cubre alguna O/C. */
  cut: number;
  /** Lo pedido que aún no cubre ninguna O/C: lo que falta cortar. */
  remaining: number;
  /** Lo realmente cortado en todas las O/C; puede pasar de lo pedido (202610280014). */
  cutDone: number;
  /** El estilo y el color de la prenda, para «Iniciar corte» (2026-10-30). */
  productId: number | null;
  styleCode: string | null;
  color: string | null;
}

/**
 * «Iniciar corte» (2026-10-30): el corte de un estilo + color con todas sus
 * tallas y su tela, en una sola transacción. Abre una O/C nueva o corrige una.
 */
export interface RegisterCutFullPayload {
  /** null = O/C nueva. */
  cutOrderId: number | null;
  /** El código de la O/C nueva; vacío = el siguiente OCT- del sistema. */
  code: string | null;
  cutOn: string | null;
  items: Array<{ productionOrderItemId: number; cutQuantity: number }>;
  /** La tela de la O/C; null la deja como está y [] la quita toda. */
  fabrics: CutFabricInput[] | null;
  /** Corregir lo cortado de una O/C que ya existe (`cutOrderId`). */
  correct: boolean;
}

/** Un atributo por el que se puede cortar. `termId` null = todas las prendas. */
export interface CutAttribute {
  termId: number | null;
  termName: string;
  groupName: string | null;
  items: CutAttributeItem[];
}

export interface CutOrderLine {
  productionOrderItemId: number;
  label: string;
  sizeName: string | null;
  quantity: number;
  /** Lo pedido de la talla (202611040001): ningún corte lo mueve. */
  ordered: number;
  /** Lo que salió del corte (202610150001); null mientras no se registre. */
  cutQuantity: number | null;
}

export interface CutOrder {
  id: number;
  /** OCT-0001, o el código que se tecleó al iniciar el corte. */
  code: string;
  /** El color común de sus prendas; null si son de varios o no tienen color. */
  termId: number | null;
  termName: string | null;
  total: number;
  /** Lo cortado de toda la O/C; null si aún no se registró nada. */
  cutTotal: number | null;
  /** Lo cortado sobre lo pedido, en % (102 = 2 % de más); null sin corte (2026-10-30). */
  orderPercent: number | null;
  /** Día del corte (YYYY-MM-DD, Lima). */
  cutOn: string | null;
  items: CutOrderLine[];
}

export interface CutOrders {
  productionOrderId: number;
  /** La fecha programada (pactada) del Corte de la OP; la que lee el Plan (202610280015). */
  cutPlannedDate: string | null;
  attributes: CutAttribute[];
  cutOrders: CutOrder[];
}
