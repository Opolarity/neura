import { ProductionItemSizeParts } from "../utils/productionItemDisplay";
import { ProductionOrderStatus } from "./productionOrders.types";

/**
 * En qué punto está una prenda del plan.
 *
 * Lo calcula el backend a partir de lo RECIBIDO EN STOCK contra lo pedido, no
 * del estado de la orden: los dos no coinciden y hacen falta los dos. Una orden
 * puede estar culminada —sus servicios terminaron— con las prendas todavía sin
 * ingresar a almacén.
 */
export type ProductionItemStatus = "PENDING" | "IN_PROGRESS" | "DONE";

/** Una categoría del producto de la fila. Un producto puede tener varias. */
export interface ProductionPlanCategory {
  id: number;
  name: string;
}

/**
 * Una columna de proceso de la tabla.
 *
 * Son TODOS los procesos activos del tenant, no solo los de las órdenes que se
 * ven: la planilla es siempre la misma rejilla y no cambia de columnas al
 * cambiar de filtro ni al pasar de página. Un proceso por el que la fila no
 * pasa se lee como vacío, que también es información.
 *
 * El orden lo pone el backend —el paso medio en que aparece el proceso—, así
 * que la lista se pinta tal cual llega.
 */
export interface ProductionPlanProcessColumn {
  /** Null en un servicio al que aún no se le asignó proceso en la ruta. */
  processId: number | null;
  processName: string;
  processGroupId: number | null;
  processGroupName: string | null;
}

/**
 * Lo que salió de UNA prenda en UN proceso.
 *
 * `null` no es cero: cero es «pasó y no salió nada», null es «pasó, pero no se
 * sabe cuánto». Pasa cuando el avance cubre varias prendas y no se registró el
 * desglose —el servicio declara un solo número para el conjunto—, y entonces la
 * celda pinta un guion en vez de un número inventado.
 */
export interface ProductionPlanProcessCellData {
  /**
   * Lo pedido EN ESE PROCESO. Va en cada columna y no solo al principio de la
   * fila porque lo que entra en un proceso es lo que salió del anterior, no lo
   * que se pidió de entrada: sin esta referencia al lado, el bueno y el malo
   * son cifras sueltas contra las que no se puede comparar nada.
   *
   * Nunca es null: lo pedido se sabe siempre.
   */
  requested: number;
  good: number | null;
  bad: number | null;
  /** Solicitado − bueno − malo, nunca negativo: la merma cierra la cuenta. */
  remaining: number | null;
  /**
   * El estado DE ESTA PRENDA en este proceso, no el de la orden.
   *
   * La ruta que viaja aparte describe la orden entera, y con tres tallas eso
   * decía que Corte no está culminado hasta que pasan las tres — así que
   * avanzar una sola no le abría su propio Costura. Estos tres campos son de
   * la prenda, y son los que mandan en la celda.
   */
  isComplete: boolean;
  isBlocked: boolean;
  /** Qué le debe esta prenda a los procesos anteriores, con sus unidades. */
  blockedBy: string | null;
}

/**
 * Las celdas de una fila, por `processId`.
 *
 * Un mapa y no un array paralelo a las columnas: la tabla busca la celda de la
 * columna que está pintando, y un array obligaría a que los dos órdenes no se
 * despeguen nunca. La ausencia de una clave es el hueco de la rejilla: esta
 * prenda no pasa por ese proceso.
 */
export type ProductionPlanProcessCells = Record<
  number,
  ProductionPlanProcessCellData
>;

/**
 * Una fila del Plan Maestro Producción: una VARIACIÓN de una orden.
 *
 * Es un ítem de la orden, no un grupo. Antes la fila era el producto+color y
 * sus tallas viajaban dentro en `sizes[]`; ahora cada talla es su propia línea
 * y la lista se lee como un inventario, una línea por SKU.
 */
export interface ProductionPlanRow {
  /** El ítem de la orden. Es la identidad de la fila y su key de React. */
  productionOrderItemId: number;
  productionOrderId: number;
  productionOrderName: string;
  /** OP-0001 / OM-0001. Null en órdenes anteriores al código (no debería quedar ninguna). */
  productionOrderCode: string | null;
  productionOrderClassId: number | null;
  productionOrderClassName: string | null;
  productionOrderStatus: ProductionOrderStatus;
  promisedDate: string | null;
  /** Cuándo se pidió: la fecha de alta de la orden. */
  createdAt: string | null;
  productId: number | null;
  productTitle: string | null;
  /** Las del producto, no las de la orden. Vacío si no tiene ninguna. */
  categories: ProductionPlanCategory[];
  variationId: number | null;
  sku: string | null;
  /** Los términos que NO son talla — el color. Parte de la identidad de la fila. */
  variationTerms: string | null;
  /** Id del término. Es el orden del catálogo (S, M, L, XL), no el alfabético. */
  termId: number | null;
  /** «S», «M»… o «—» cuando la variación no tiene término de talla. */
  termName: string;
  /**
   * El sistema de tallas de la fila —«Tallas», «Tallas Pantalon»—, o null si
   * la prenda no tiene talla. No se filtra por él; sirve para rotular sin
   * adivinar de qué catálogo sale la talla.
   */
  termGroupId: number | null;
  termGroupName: string | null;
  /** Lo SOLICITADO de esta variación en la orden. */
  quantity: number;
  received: number;
  /** Nunca negativo: si llegó de más, lo que falta es cero. */
  pending: number;
  status: ProductionItemStatus;
  /**
   * Si esta prenda ya pasó TODOS los procesos que la cubren.
   *
   * No es lo mismo que `status`, que habla de lo RECIBIDO en stock: una prenda
   * puede tener la ruta terminada y no haber entrado todavía a almacén — que
   * es justo el momento en el que hay que poder ingresarla. Y no es el
   * `isComplete` del paso, que es del proceso entero: con un servicio por
   * talla, esa cifra la bloquea la talla más lenta.
   */
  routeDone: boolean;
  /** Ingreso cerrado a mano: «ya no entra más». El botón Ingresar sale en verde. */
  intakeClosed: boolean;
  /**
   * Lo que salió de esta prenda en cada proceso, por `processId`.
   *
   * Es el cruce de la matriz, y no sale de `routes`: el avance de la ruta es
   * el de la ORDEN —el mismo número para todas sus variaciones— y la planilla
   * existe justamente para distinguirlas.
   */
  processes: ProductionPlanProcessCells;
}

export interface ProductionPlanFilters {
  search?: string | null;
  /**
   * Rango de ENTREGA COMPROMETIDA de la orden (`promised_date`), como fechas de
   * calendario "YYYY-MM-DD".
   *
   * Viene puesto con el mes en curso: la pregunta que se hace de verdad es qué
   * hay que entregar este mes, no qué hay en total. Una orden sin fecha de
   * entrega queda fuera del rango — deliberado, para no mezclar «vence en
   * octubre» con «no se sabe».
   */
  promised_from?: string | null;
  promised_to?: string | null;
  /**
   * La categoría del producto. NO hay filtro por sistema de tallas a
   * propósito: el Plan Maestro se mira entero, y cada talla es su propia fila
   * en vez de encabezar una columna.
   */
  category_id?: number | null;
  /** El de la PRENDA: lo recibido contra lo pedido. */
  status?: ProductionItemStatus | null;
  /**
   * El de la ORDEN, que no es el mismo: una orden puede estar culminada --sus
   * servicios terminaron-- con las prendas todavía sin ingresar a almacén.
   */
  production_order_status?: ProductionOrderStatus | null;
  production_order_class_id?: number | null;
  production_order_id?: number | null;
  page?: number;
  size?: number;
}

/** Una prenda tal como la nombra `fn_production_order_item_display`. */
export interface ProductionItemDisplay extends ProductionItemSizeParts {
  id: number;
  /** Talla y color ya unidos: «S / Azul». */
  variationTerms: string | null;
  sku: string | null;
}

/**
 * Un servicio que cubre un proceso de la ruta, con lo justo para AVANZARLO.
 *
 * Es el mismo conjunto que pide `ServiceProgressTarget`: sin `situationRowId`
 * no hay fila a la que bajarle `last_row` y el avance no se puede lanzar.
 */
export interface ProductionPlanRouteService {
  supplierServiceId: number;
  serviceCode: string | null;
  serviceDescription: string;
  moduleId: number;
  materialId: number | null;
  materialMeasurementUnit: string | null;
  /** El proveedor que hace el proceso. Destinatario de su guía de remisión. */
  supplierId: number | null;
  supplierName: string | null;
  supplierDocumentType: string | null;
  supplierDocumentNumber: string | null;
  supplierAddress: string | null;
  supplierPhone: string | null;
  situationRowId: number | null;
  situationId: number | null;
  situationName: string;
  /**
   * Si la mercadería YA SALIÓ hacia este taller: la situación vigente es
   * «Enviado al proveedor» o posterior. Lo calcula la base
   * (`fn_supplier_service_is_dispatched`) y no la rejilla, porque el empate de
   * `order` entre «Cotizado» y «Enviado al proveedor» no se resuelve mirando
   * solo el número.
   *
   * Mientras sea falso, lo que toca en ese paso es mandar la mercadería, no
   * registrar lo que vuelve.
   */
  dispatched: boolean;
  /**
   * Cuándo toca este servicio, tal como se pactó al cotizar. NO es la entrega
   * de la orden --esa es de la fila, y la pinta la columna «Entrega»--: aquí
   * cada paso tiene la suya.
   */
  promisedDate: string | null;
  /**
   * Cuándo terminó DE VERDAD este servicio. La pone la situación de
   * finalización en el backend, no se teclea; null mientras no haya terminado.
   * Se lee al lado de `promisedDate`: lo pactado contra lo cumplido.
   */
  endDate: string | null;
  /** Moneda pactada (ISO) y condición de pago, de la cotización del servicio. */
  currency: string | null;
  paymentTerms: string | null;
  /** Lo ÚLTIMO registrado. */
  quantity: number | null;
  /** Lo PEDIDO en el proceso. Ultima red del sembrado. */
  requestedQuantity: number | null;
  /**
   * Lo que ENTRA en el paso: lo que salio bueno del anterior, o lo que pide la
   * orden en el primero. Es con lo que abre el dialogo de avance.
   */
  incomingQuantity: number | null;
  badQuantity: number | null;
  price: number | null;
  measurementUnit: string | null;
  /**
   * Las prendas que cubre ESTE paso.
   *
   * Con una sola, sus números son de ella y la talla se puede llevar por su
   * cuenta. Con varias, el avance es del conjunto: el modelo no guarda
   * cantidades por prenda dentro de un paso (se retiraron en 202609110001).
   */
  itemIds: number[];
  /** «título · sku», el texto plano del backend. Para pintar, `itemDetails`. */
  itemNames: string[];
  /** Las mismas prendas con producto, variación y sku por separado. */
  itemDetails: ProductionItemDisplay[];
}

/** El avance agregado de un proceso, sobre las prendas que cubre. */
export interface ProductionPlanRouteProgress {
  requested: number;
  advanced: number;
  bad: number;
  remaining: number;
}

/**
 * Un paso de la ruta: un proceso de la orden con su estado.
 *
 * Se lee de izquierda a derecha por `order`, que es como se lee la ruta en la
 * planilla con la que se trabaja hoy.
 */
export interface ProductionPlanRouteStep {
  order: number;
  processId: number | null;
  processName: string;
  processGroupId: number | null;
  processGroupName: string | null;
  stepsTotal: number;
  stepsDone: number;
  isComplete: boolean;
  isBlocked: boolean;
  /** Qué procesos anteriores faltan, ya formateado: «Corte (1/2)». */
  blockedBy: string | null;
  progress: ProductionPlanRouteProgress;
  services: ProductionPlanRouteService[];
}

/**
 * Las rutas de la página, por orden.
 *
 * Un mapa y no un campo de cada fila porque varias filas del plan son prendas
 * de la MISMA orden y comparten ruta.
 */
export type ProductionPlanRoutes = Record<number, ProductionPlanRouteStep[]>;
