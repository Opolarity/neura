import { ProductionItemSizeParts } from "../utils/productionItemDisplay";
import { LinkedService } from "./productionOrderServices.types";

/**
 * En qué punto está la orden. Lo calcula el backend a partir de sus servicios
 * vinculados -- `fn_production_order_status` -- así que no se guarda en ningún
 * sitio ni se puede editar desde aquí.
 *
 * Llega como código y no como etiqueta, igual que las situaciones: el nombre
 * que ve la persona lo pone el ERP.
 */
export type ProductionOrderStatus = "DRAFT" | "IN_PROGRESS" | "DONE";
/**
 * Origen de la orden, un eje distinto de la clase (PRODUCCIÓN/MUESTRA):
 * - `CONSIGNMENT`: lote enviado por Overtake. Se muestra en solo lectura, sin
 *   receta, materiales ni operaciones.
 * - `PRODUCTION`: orden de producción real creada en el ERP.
 * `null` en las órdenes anteriores a la columna. Lo fija el backend al crear.
 */
export type ProductionOrderType = "CONSIGNMENT" | "PRODUCTION";
/** Fila del listado de órdenes de producción. */
export interface ProductionOrder {
  id: number;
  name: string;
  /** OP-0001 / OM-0001. Lo fija el backend al crear. */
  code: string | null;
  description: string | null;
  /**
   * Suma de las cantidades de los ítems. El SP la calcula y la GUARDA en
   * la columna al crear, y la reescribe al editar los ítems.
   */
  quantity: number | null;
  productionOrderClassId: number;
  productionOrderClassName: string;
  itemsCount: number;
  status: ProductionOrderStatus;
  /** Origen de la orden. `null` en las históricas anteriores a la columna. */
  type: ProductionOrderType | null;
  createdAt: string;
}

/** Ítem dentro del detalle de una orden. */
export interface ProductionOrderItem extends ProductionItemSizeParts {
  /** Ausente en los ítems que aún no se han guardado. */
  id?: number;
  name: string;
  quantity: number;
  /**
   * Unidades que ya entraron a stock. Lo suma el backend de los movimientos
   * de esa prenda, así que no se guarda en la orden ni se puede desfasar.
   */
  received: number;
  /**
   * Cierre MANUAL del ingreso a stock: «ya no entra más». Es lo que bloquea
   * la prenda en el diálogo de recepción --no el conteo-- y lo que pinta en
   * verde el botón Ingresar del plan. Definitivo: no se reabre desde el ERP.
   */
  intakeClosed: boolean;
  /**
   * Lo que salió BUENO del último paso de la ruta de esta prenda.
   *
   * Es lo que de verdad hay para ingresar a stock, y no tiene por qué ser lo
   * pedido: se piden 15 y el taller entrega 25, o entrega 12.
   *
   * Null cuando no se sabe --un servicio que cubre varias prendas no dice
   * cuántas salieron de cada una-- o cuando la orden no tiene ruta. Entonces
   * se cae a lo pedido.
   */
  routeOutput: number | null;
  /** Nullable: un ítem puede no estar atado a ninguna explosión. */
  explosionId: number | null;
  explosionDescription: string | null;
  /** Código del molde de la receta que cubre esta prenda. */
  explosionModelCode: string | null;
  explosionTotal: number | null;
  /**
   * El producto final del ítem. Sin él no hay costo unitario: el backend
   * cuenta las prendas buenas por los movimientos de esta variación.
   */
  variationId: number | null;
  variationSku: string | null;
  /**
   * Las fotos del PRODUCTO, en el orden en que se subieron.
   *
   * Del producto y no de la talla: dos tallas del mismo polo enseñan las
   * mismas. Es lo que la Orden de Producción imprime como referencia visual.
   */
  productImages: string[];
  /**
   * El PRODUCTO, no la variación. La clasificación -- categorías y etiquetas --
   * cuelga del producto: dos tallas del mismo polo comparten las suyas.
   */
  productId: number | null;
  /**
   * El título con los términos de la variación: «Chompa Overtake Fire - M».
   * El título a secas no basta — una prenda es un producto con una variación
   * por talla, así que todas se llamarían igual.
   */
  variationLabel: string | null;
  /**
   * Categorías y etiquetas del PRODUCTO del ítem — no de la variación:
   * `product_categories` y `product_tags` cuelgan de `products`, así que todas
   * las tallas de una prenda comparten las mismas. Vacías mientras el ítem no
   * tenga producto asignado.
   */
  categories: string[];
  tags: string[];
}

export interface ProductionOrderDetail {
  id: number;
  name: string;
  /** OP-0001 / OM-0001. Lo fija el backend al crear. */
  code: string | null;
  description: string | null;
  /** Valor guardado por el SP; en el formulario es de solo lectura. */
  quantity: number | null;
  productionOrderClassId: number;
  productionOrderClassName: string;
  status: ProductionOrderStatus;
  /** Origen de la orden. `null` en las históricas anteriores a la columna. */
  type: ProductionOrderType | null;
  createdAt: string;
  /** Quién creó la orden. El requerimiento lo imprime como SOLICITANTE. */
  createdByName: string | null;
  /**
   * Última edición. Se devuelve tal cual al guardar: si para entonces el
   * backend tiene otra, alguien tocó la orden mientras estaba abierta.
   */
  updatedAt: string | null;
  /** Entrega comprometida. Calendario de Lima, "YYYY-MM-DD". */
  promisedDate: string | null;
  /** Cuándo terminó. Calendario de Lima, "YYYY-MM-DD". */
  finishDate: string | null;
  items: ProductionOrderItem[];
  /**
   * Servicios que cuelgan de esta orden. La orden no los referencia: el
   * vínculo son las filas de `production_order_info`, una por servicio. Cada
   * uno dice de qué cotización viene, pero lo que entra y sale de la orden es
   * el servicio suelto.
   */
  services: LinkedService[];
}

export interface ProductionOrdersFilters {
  search?: string | null;
  production_order_class_id?: number | null;
  /** Filtra por origen: CONSIGNMENT / PRODUCTION. Sin valor = todas. */
  type?: ProductionOrderType | null;
  page?: number;
  size?: number;
}

export interface ProductionOrderClassOption {
  id: number;
  name: string;
  code?: string | null;
}

/** Opción del combobox de explosiones dentro de un ítem. */
export interface ExplosionOption {
  id: number;
  /** Lo que se ve: `#12 · Girls Fame...`. Corto porque la celda es estrecha. */
  label: string;
  /**
   * El texto completo -- nombre entero y las prendas que cubre.
   *
   * No se pierde al acortar: sale como `title` al pasar el ratón, que es donde
   * se distinguen dos recetas que se llaman parecido.
   */
  title?: string;
  /**
   * Las prendas que cubre la receta. Vacío = genérica.
   *
   * Es lo que permite ofrecer al ítem solo las suyas, y caer en todas cuando
   * su prenda no tiene ninguna asignada.
   *
   * Opcional porque el combobox solo transporta id y label: las opciones que
   * se construyen a mano (la recién creada) no lo traen.
   */
  variationIds?: number[];
}

export interface ProductionOrderItemPayload {
  /**
   * Va SIEMPRE que el ítem ya exista. Sin él el backend no puede saber qué
   * ítem es cuál y tendría que borrarlos y recrearlos — que es justo lo que
   * reventaba contra la matriz de avance y le cambiaba el id a cada prenda.
   */
  id?: number;
  quantity: number;
  explosion_id: number | null;
  variation_id: number | null;
}

/** quantity no viaja: la calcula y guarda el SP desde los ítems. */
export interface SaveProductionOrderData {
  id?: number;
  name: string;
  production_order_class_id: number;
  description?: string | null;
  /**
   * Se mandan SIEMPRE, también en null: la edge function de edición solo
   * toca la fecha si la clave viene, y sin mandarla no habría forma de
   * borrar una entrega que ya no aplica.
   */
  promised_date?: string | null;
  finish_date?: string | null;
  /** La marca leída al abrir. Ausente = no comprobar (altas y llamadas de sistema). */
  expected_updated_at?: string | null;
  items: ProductionOrderItemPayload[];
}
