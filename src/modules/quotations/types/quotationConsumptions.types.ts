/**
 * Qué material consume un paso, y en qué almacén lo trabaja el taller.
 *
 * Vive en la COTIZACIÓN y no en cada servicio porque una cotización **es** un
 * paso: cubre un solo proceso, y sus servicios son la misma tarea repetida por
 * talla. Declararlo aquí se dice una vez por paso en vez de una por talla.
 *
 * No hay cantidad a propósito: el consumo unitario lo dice la receta, por
 * prenda y por variación. Repetirlo aquí sería una segunda fuente que puede
 * contradecirla y quedarse vieja en silencio al primer cambio de receta. Esta
 * declaración solo dice QUÉ, nunca CUÁNTO.
 */

/** Un material de la receta, con si este paso lo consume. */
export interface QuotationConsumptionMaterial {
  materialId: number;
  /** La casilla es por VARIACIÓN: el paso puede consumir el Negro y no el Blanco. */
  materialVariationId: number;
  /** Etiqueta de la variación ("Jersey 30/1 · Negro"). */
  name: string;
  /** Código de la unidad (KG, MTR, UND). Nulo si el material no la declara. */
  measurementUnit: string | null;
  /**
   * Lo que consumirían TODAS las prendas de este paso si se marca: el consumo
   * unitario de la receta por la cantidad de cada prenda. Sale de la misma
   * fuente que el requerimiento de la orden, así que los dos números no se
   * pueden contradecir.
   */
  required: number;
  consumedHere: boolean;
}

/** Un almacén entre los que se puede elegir: solo los del proveedor. */
export interface QuotationConsumptionWarehouse {
  id: number;
  name: string;
}

export interface QuotationConsumptions {
  quotationId: number;
  /** Para explicarlo cuando no tiene almacenes. */
  supplierName: string | null;
  /**
   * Los almacenes del PROVEEDOR de esta cotización, no todos. El material se
   * consume donde el taller trabaja, y ese es un almacén suyo: ofrecer los
   * propios invitaría a descontar de la empresa algo que está en el taller.
   *
   * Puede venir vacío — un proveedor sin almacén — y entonces no se puede
   * declarar consumo hasta crearle uno.
   */
  warehouses: QuotationConsumptionWarehouse[];
  /** Dónde trabaja el taller este encargo. Null = todavía sin elegir. */
  warehouseId: number | null;
  /**
   * TODOS los materiales de la receta de las prendas que el paso atraviesa, no
   * solo los marcados: la pantalla es una lista de casillas y necesita los
   * candidatos para pintarla.
   */
  materials: QuotationConsumptionMaterial[];
}
