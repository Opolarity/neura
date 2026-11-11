/**
 * La tela del corte de una OP (202610280002). La tela se elige del catálogo
 * de Materiales con su almacén y, al guardar el corte, sale de ese almacén
 * como egreso vinculado a la OP (202610280004). De lo utilizado y lo que
 * sobró sale el consumo real:
 *
 *     consumo real = (utilizado − sobrante) / prendas cortadas
 */

/** Un material de la OP: lo que salió a ella por otros caminos de Materiales y lo que usan sus O/C. */
export interface CutFabricMaterial {
  materialVariationId: number;
  label: string;
  /** Código de la unidad del material (MTR, KG...). */
  unit: string | null;
  unitName: string | null;
  /** Neto de los movimientos de Materiales vinculados a la OP, sin los egresos del corte. */
  issued: number;
  /** Utilizado − sobrante, sumado en todas las O/C. */
  used: number;
}

/** El uso de la tela en la prenda (2026-10-30). */
export type CutFabricUsage = "MAIN" | "SECONDARY" | "LINING" | "COMPLEMENT" | "FUSIBLE";

export const CUT_FABRIC_USAGE_LABELS: Record<CutFabricUsage, string> = {
  MAIN: "Tela principal",
  SECONDARY: "Tela secundaria",
  LINING: "Forro",
  COMPLEMENT: "Complemento",
  FUSIBLE: "Fusionable",
};

/** La tela de un material en una O/C. */
export interface CutFabricLine {
  materialVariationId: number;
  label: string;
  unit: string | null;
  /** El almacén del que salió; null en lo registrado antes de 202610280004. */
  warehouseId: number | null;
  warehouseName: string | null;
  used: number;
  leftover: number;
  usage: CutFabricUsage | null;
  /** Utilizado − sobrante, por prenda cortada; null sin corte (202611040003). */
  consumption: number | null;
  /** Lo que puede usar al corregir: el stock del almacén + lo que esta línea ya descontó. */
  available: number | null;
}

/** La unidad de la merma: se elige al ingresarla, no es la de la tela. */
export type CutWasteUnit = "KG" | "MTR";

export const CUT_WASTE_UNIT_LABELS: Record<CutWasteUnit, string> = {
  KG: "Kilogramos",
  MTR: "Metros",
};

/** Merma ingresada de una tela en una O/C (202611060010). */
export interface CutWasteEntry {
  id: number;
  materialVariationId: number;
  label: string;
  warehouseId: number | null;
  warehouseName: string | null;
  quantity: number;
  unit: CutWasteUnit;
}

export interface AddCutWasteInput {
  cutOrderId: number;
  materialVariationId: number;
  warehouseId: number;
  quantity: number;
  unit: CutWasteUnit;
}

export interface CutOrderFabric {
  cutOrderId: number;
  code: string;
  /** Prendas cortadas; null si aún no se registra el corte. */
  garments: number | null;
  /** Utilizado − sobrante; null sin tela. */
  net: number | null;
  /** Neto / prendas (de la tela principal si la hay); null sin tela o sin corte. */
  realConsumption: number | null;
  fabrics: CutFabricLine[];
  /** La merma ingresada: no entra en el consumo real. */
  waste: CutWasteEntry[];
}

/** Un almacén propio del que puede salir la tela. */
export interface CutFabricWarehouse {
  warehouseId: number;
  name: string;
}

export interface CutFabric {
  /**
   * Si la tela se registra en el corte (202611100005). No, en una OP propia
   * con el Corte de un proveedor: su encargo ya la consume al recibirse.
   */
  fabricByCut: boolean;
  materials: CutFabricMaterial[];
  cutOrders: CutOrderFabric[];
  warehouses: CutFabricWarehouse[];
}

/** Una tela del catálogo en el buscador, con su stock en cada almacén propio. */
export interface CutFabricOption {
  materialVariationId: number;
  code: string;
  label: string;
  unit: string | null;
  /** El stock en todos los almacenes propios; sin stock no se elige (2026-10-30). */
  totalStock: number;
  stock: Array<{ warehouseId: number; warehouseName: string; stock: number }>;
}

/** Una línea de tela que se manda con el corte (2026-10-30). */
export interface CutFabricInput {
  materialVariationId: number;
  warehouseId: number;
  usage: CutFabricUsage;
  used: number;
  leftover: number;
}
