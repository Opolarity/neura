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

/** El producto al que pertenece una receta (una por producto). */
export interface ExplosionProduct {
  id: number;
  title: string;
  code: string | null;
}

/**
 * Receta antigua "por unificar": el producto al que podría pertenecer (todas
 * sus prendas son de él) y con qué otras recetas compite por ese producto.
 */
export interface ExplosionUnify {
  productId: number;
  productTitle: string | null;
  /** El producto ya tiene su receta: esta ya no se puede unificar a él. */
  hasRecipe: boolean;
  competitors: number[];
}

/** Fila del listado de explosiones. */
export interface Explosion extends ExplosionVariations {
  id: number;
  /** null = receta antigua (por unificar) o genérica. */
  productId: number | null;
  productTitle: string | null;
  description: string;
  /** Código del molde. Texto libre; null sin él. */
  modelCode: string | null;
  /** Calculado en el backend: SUM(cantidad × costo unitario). */
  total: number;
  /** Cuántas etapas declara el molde. 0 = la orden armará su ruta a mano. */
  processesCount: number;
  createdAt: string;
}

/**
 * Una etapa de la ruta de la receta.
 *
 * La receta dice por dónde PASA el molde -- Corte, Confección, Acabados -- y
 * no baja a la operación concreta: con qué operación se resuelve cada etapa se
 * decide en la orden, que es donde hay taller, fechas y cotización.
 *
 * Es opcional: una receta puede tener solo materiales, solo etapas o las dos
 * cosas.
 */
export interface ExplosionProcessOperation {
  processId: number;
  processName: string | null;
}

export interface ExplosionProcess {
  processGroupId: number;
  processGroupName: string | null;
  /**
   * Las operaciones de ESTA etapa que se hacen. Vacío = la etapa va completa,
   * sin bajar al detalle.
   *
   * No son etapas seguidas: comparten la posición de su etapa, y por eso la
   * orden las lee como un solo paso con N sub-pasos ("Corte 0/2").
   */
  operations: ExplosionProcessOperation[];
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
  /**
   * La variación que consume la línea ("Jersey 30/1 · Negro"). Null solo en
   * una línea recién puesta con un material que aún no se resolvió; el
   * backend usa entonces la única variación del material.
   */
  materialVariationId: number | null;
  /** Etiqueta de la variación. */
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
  /** Con producto la receta cubre todas sus variaciones. */
  product: ExplosionProduct | null;
  /** Solo en recetas antiguas sin producto; null si no hay a cuál unificarla. */
  unify: ExplosionUnify | null;
  description: string;
  /** Código del molde. Texto libre; null sin él. */
  modelCode: string | null;
  total: number;
  createdAt: string;
  materials: ExplosionMaterial[];
  /** En el orden en que se recorren. Vacío = la receta no declara ruta. */
  processes: ExplosionProcess[];
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
  /**
   * El producto de la receta. Con él la receta cubre TODAS sus variaciones (el
   * backend las pone) y ya no se mandan `variation_ids`. Una segunda receta
   * para el mismo producto la rechaza el backend.
   */
  product_id?: number | null;
  /**
   * Las etapas, EN ORDEN: la posición en el array es la secuencia, no se manda
   * un número de paso. Se manda siempre, también vacío -- vacío quita la ruta
   * y la clave ausente la dejaría como está.
   */
  processes?: Array<{
    process_group_id: number;
    /** Vacío = proceso completo. */
    operations: Array<{ process_id: number }>;
  }>;
}
