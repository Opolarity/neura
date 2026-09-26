/**
 * Requerimiento de materiales de una orden.
 *
 * La explosión guarda el consumo por UNIDAD -- 0.3 kg de jersey por polo -- y
 * esto es esa cifra multiplicada por la cantidad de cada prenda, agrupada por
 * material. Es la pregunta que se hace antes de lanzar la producción: cuánta
 * tela hace falta y si alcanza.
 */

/** De qué prenda sale cada parte del requerimiento. */
export interface MaterialRequirementBreakdown {
  productionOrderItemId: number;
  itemName: string;
  itemQuantity: number;
  unitConsumption: number;
  required: number;
}

export interface MaterialRequirementRow {
  materialId: number;
  /** Una fila por VARIACIÓN: el Negro y el Blanco se compran por separado. */
  materialVariationId: number;
  variationCode: string;
  /** Etiqueta de la variación ("Jersey 30/1 · Negro"). */
  materialName: string;
  /** A quién se le compra hoy esa variación: lo que propone la compra. */
  supplierId: number | null;
  /** Lo que cuesta hoy la variación (el `unitCost` es el de la foto). */
  currentUnitCost: number | null;
  measurementUnit: string;
  /**
   * La clase del material — TELA, AVIOS. Es el «Tipo:» por el que el papel del
   * taller agrupa las líneas, y por eso viaja hasta aquí: la Orden de
   * Producción impresa agrupa el pie por ella.
   */
  materialClassId: number | null;
  materialClassName: string | null;
  totalRequired: number;
  stock: number;
  /**
   * El mismo saldo partido por dueño del almacén: lo que está en mis almacenes
   * y lo que ya está en un taller. El total y el faltante no cambian —el
   * material es mío esté donde esté—, pero comprar y mover son dos cosas
   * distintas, y con un solo número no se distinguen.
   */
  stockOwn: number;
  stockAtSuppliers: number;
  /** Nunca negativo: si sobra material, es cero. */
  missing: number;
  unitCost: number | null;
  totalCost: number | null;
  breakdown: MaterialRequirementBreakdown[];
}

/** Un material dentro del requerimiento de UNA prenda. */
export interface MaterialRequirementItemMaterial {
  materialId: number;
  materialVariationId: number;
  materialName: string;
  measurementUnit: string;
  materialClassId: number | null;
  materialClassName: string | null;
  /** Lo que consume una unidad de esta prenda. */
  unitConsumption: number;
  /** Lo que consume esta prenda en total: unitario × cantidad. */
  required: number;
  /**
   * Stock y faltante son del material en TODA la orden, no de esta prenda: el
   * stock es uno solo y un faltante no se reparte entre las prendas que
   * comparten el material. Se repite el mismo número en cada grupo.
   */
  stock: number;
  stockOwn: number;
  stockAtSuppliers: number;
  missing: number;
  unitCost: number | null;
  cost: number | null;
  /** Qué parte del costo de la prenda es este material, en %. Null sin costo. */
  sharePct: number | null;
}

/** La misma explosión vista por prenda: qué lleva y cuánto cuesta. */
export interface MaterialRequirementItem {
  productionOrderItemId: number;
  /**
   * «Producto · SKU», como lo arma el backend. Se conserva como respaldo para
   * el ítem sin producto asignado, que llega como «Item #id»; el encabezado
   * pinta `productTitle` y `variationTerms`, que no repiten el SKU.
   */
  itemLabel: string;
  productTitle: string | null;
  /** La variación en sí: talla, color. Vacío si el ítem no tiene producto. */
  variationTerms: string[];
  variationSku: string | null;
  itemQuantity: number;
  subtotalCost: number;
  /** Cierto si alguno de SUS materiales no alcanza. */
  hasShortage: boolean;
  materials: MaterialRequirementItemMaterial[];
}

export interface MaterialRequirement {
  productionOrderId: number;
  /** Agregado por material: cuánto hay que comprar en total de cada uno. */
  materials: MaterialRequirementRow[];
  /** Agrupado por prenda: lo que pinta el panel. */
  items: MaterialRequirementItem[];
  estimatedTotalCost: number;
  hasShortage: boolean;
}
