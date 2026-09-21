/** Categoría del producto al que pertenece la receta. */
export interface ExplosionCategory {
  id: number;
  name: string;
}

/** Una prenda que cubre la receta. */
export interface ExplosionVariationRef {
  variationId: number;
  variationSku: string | null;
  productId: number | null;
  productTitle: string | null;
  /** «Chompa Overtake Fire · SKU-123», igual que en la orden de producción. */
  variationLabel: string | null;
}

/**
 * Las prendas que cubre la receta, y las categorías de sus productos.
 *
 * Puede no cubrir ninguna: una receta genérica sigue siendo una receta, y se
 * puede escribir antes de saber a qué va.
 *
 * Las categorías salen del PRODUCTO, no de la variación, así que todas las
 * tallas de una prenda comparten las mismas — y aquí van sin repetir.
 */
export interface ExplosionVariations {
  variations: ExplosionVariationRef[];
  categories: ExplosionCategory[];
}

/** Fila del listado de explosiones. */
export interface Explosion extends ExplosionVariations {
  id: number;
  description: string;
  /** Código del molde. Texto libre; null sin él. */
  modelCode: string | null;
  /** Calculado en el backend: SUM(cantidad × costo unitario). */
  total: number;
  createdAt: string;
}

/** Línea de materiales dentro del detalle de una explosión. */
/** Una excepcion de consumo: lo que lleva UNA prenda de una linea. */
export interface ExplosionMaterialVariation {
  variationId: number;
  /** Cero = esta prenda no lleva el material. */
  quantity: number;
}

export interface ExplosionMaterial {
  /** Ausente en las líneas que aún no se han guardado. */
  id?: number;
  materialId: number;
  materialName: string;
  /** TELA, AVIOS… Es el «Tipo:» por el que se agrupa el requerimiento impreso. */
  materialClassId: number | null;
  materialClassName: string | null;
  measurementUnit: string | null;
  unitCost: number | null;
  quantity: number | null;
  lineTotal: number;
  /**
   * Lo que consume una prenda concreta, cuando no es la cantidad general.
   *
   * Vacio -- lo normal -- significa que la general vale para todas. Cero en
   * una prenda significa que esa NO lo lleva.
   */
  variations: ExplosionMaterialVariation[];
}

export interface ExplosionDetail extends ExplosionVariations {
  id: number;
  description: string;
  /** Código del molde. Texto libre; null sin él. */
  modelCode: string | null;
  total: number;
  createdAt: string;
  materials: ExplosionMaterial[];
}

export interface ExplosionsFilters {
  search?: string | null;
  variation_id?: number | null;
  product_id?: number | null;
  /** Arrastra las subcategorías: el SP resuelve el árbol. */
  category_id?: number | null;
  /** null = todas · true = solo sin prenda · false = solo con prenda. */
  without_variation?: boolean | null;
  page?: number;
  size?: number;
}


/** Lo que se manda al backend por cada línea. */
export interface ExplosionMaterialPayload {
  material_id: number;
  quantity: number | null;
  /**
   * Las excepciones por prenda. Se manda solo lo que DIFIERE de la cantidad
   * general: mandar las cuatro tallas con el mismo numero convertiria cada
   * receta en una matriz que hay que mantener.
   */
  variations?: Array<{ variation_id: number; quantity: number }>;
}

export interface SaveExplosionData {
  id?: number;
  /** Se manda siempre: vacío lo borra, y ausente el backend no lo toca. */
  model_code?: string | null;
  materials: ExplosionMaterialPayload[];
  /**
   * Los ids de prenda que cubre. La CLAVE AUSENTE deja las prendas como
   * están; un array VACÍO las quita todas. Con la columna suelta de antes esos
   * dos casos eran indistinguibles.
   */
  variation_ids?: number[];
}
