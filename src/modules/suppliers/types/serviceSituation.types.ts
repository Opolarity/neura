/**
 * El contrato de `update-service-situation`.
 *
 * Vive aquí y no junto al servicio que lo llama porque aquel archivo arrastra
 * los tipos generados de Supabase, y con estas interfaces dentro el compilador
 * cruza su límite al inferir los joins («type instantiation is excessively
 * deep»). El servicio los re-exporta, así que quien los importaba de allí sigue
 * pudiendo hacerlo.
 */

/** Lo que salió de una prenda en este avance, y a dónde va. */
export interface ServiceSituationItemPayload {
  production_order_item_id: number;
  quantity: number;
  bad_quantity: number;
  /**
   * A dónde va ESTA prenda, cuando no es a donde va el servicio.
   *
   * Se omite en el caso normal —todas avanzan juntas— y entonces el backend le
   * pone la situación de la cabecera. Solo viaja cuando una talla lleva un
   * ritmo propio: se recibe la M y la S sigue en el taller.
   */
  situation_id?: number;
}

export interface UpdateServiceSituationParams {
  supplierServiceSituationId: number;
  supplierServiceId: number;
  moduleId: number;
  situationId: number;
  statusId: number;
  badQuantity: number | null;
  message: string | null;
  quantity: number | null;
  measurementUnit: string;
  price: number | null;
  /**
   * Si ese precio lleva IGV.
   *
   * Ya no se arrastra de un avance al siguiente: vive en la LÍNEA
   * (`supplier_services`), no en la situación. Sigue viajando por aquí porque
   * este es el único camino que tiene el editor del detalle para corregirlo;
   * omitido, el backend no lo toca.
   */
  priceIncludesTax?: boolean | null;
  /**
   * Día civil de Lima ("YYYY-MM-DD") en que ocurrió el movimiento. Es el
   * created_at de la fila de situación, y cuando la situación es la de
   * recepción ESA es la fecha real de entrega — por eso se puede fechar hacia
   * atrás: el servicio llegó el martes aunque se registre el jueves.
   * Omitido = ahora.
   */
  occurredOn?: string | null;
  /**
   * A qué almacén entra el material al recibirlo.
   *
   * Solo pinta cuando la situación es la de stock (REC-PHY) y el servicio es
   * una COMPRA: es el almacén que queda en la fila de situación y del que sale
   * el movimiento de entrada. Omitido o nulo, el backend cae al almacén del
   * perfil de quien registra -- que es lo que hacía siempre, y por eso nunca
   * preguntaba.
   */
  warehouseId?: number | null;
  /**
   * El desglose por prenda. Solo cuando el servicio cubre varias: el backend
   * exige que la suma cuadre con lo declarado.
   */
  items?: ServiceSituationItemPayload[] | null;
}
