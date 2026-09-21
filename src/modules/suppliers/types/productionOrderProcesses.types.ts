import { ProductionItemSizeParts } from "../utils/productionItemDisplay";
/**
 * Etapas por las que va pasando una orden de producción.
 *
 * Los pasos viven en `production_order_info` y **siempre** cuelgan de un
 * servicio: es lo que le da a la etapa proveedor, fecha prometida y situación.
 * Sin servicio una etapa no tiene con qué avanzar, así que su avance habría que
 * marcarlo a mano.
 *
 * Por eso la etapa no lleva fechas propias: lo prometido está en
 * `supplier_services.promised_date` y lo real en el historial de situaciones.
 */

/** Un paso: se pasa por este proceso, dentro de este grupo. */
export interface ProcessStep {
  /** Ausente en los pasos que aún no se han guardado. */
  id?: number;
  order: number;
  processId: number | null;
  processName: string | null;
  processGroupId: number | null;
  processGroupName: string | null;
  /**
   * A qué prendas de la orden cubre este paso. Vacía = a todas.
   *
   * Sale de `production_order_item_info`, la matriz paso × prenda, que es la
   * única vía: `production_order_info` tuvo una columna con el ítem en
   * singular y tener las dos abiertas fue lo que descuadró el costeo.
   */
  productionOrderItemIds: number[];
}


/**
 * Una etapa dentro de un proceso: un servicio de proveedor o trabajo de la casa.
 * `isDone` viene calculado del backend, no de una marca guardada.
 */
export interface ProcessServiceStep {
  id: number;
  supplierServiceId: number | null;
  serviceCode: string | null;
  serviceDescription: string | null;
  /** Lo prometido. Lo real sale de la situación, no de una columna. */
  promisedDate: string | null;
  situationCode: string | null;
  situationName: string | null;
  /** Las prendas que cubre. Vacía = toda la orden. */
  productionOrderItemIds: number[];
  productionOrderItemNames: string[];
  isDone: boolean;
}

/**
 * Un proceso de la ruta con los servicios que hay detrás.
 *
 * El proceso "Corte" puede tener servicio de tela y servicio de corte: sólo
 * cuando los dos están culminados el proceso cierra y se pasa al siguiente.
 * `isBlocked` avisa de que un proceso anterior sigue abierto, pero no impide
 * nada -- en un taller la tela llega tarde y se corta lo que hay.
 */
/**
 * Cuántas prendas pasaron por un proceso y cuántas quedan. Lo calcula el
 * backend (`fn_production_order_item_progress`): un proceso avanza lo que
 * avanza su servicio más lento, y no avanza nada mientras alguno siga abierto.
 */
export interface ProcessItemProgress {
  productionOrderItemId: number;
  /** Lo pedido de esa prenda. Dato real: sale de la orden. */
  requested: number;
  /**
   * Las BUENAS de esa prenda, o **null cuando no se puede saber**.
   *
   * Un servicio declara un solo número para todo lo que cubre, así que si
   * cubre varias prendas cuántas salieron de cada una es una incógnita. El
   * backend devuelve null en vez de repartirlo a ojo, y aquí se pinta «—».
   */
  advanced: number | null;
  /** La merma de esa prenda, con la misma regla que `advanced`. */
  bad: number | null;
  remaining: number | null;
}

/** Avance agregado de un proceso, sumado sobre sus prendas. */
export interface ProcessProgress {
  requested: number;
  /** Las BUENAS. */
  advanced: number;
  bad: number;
  remaining: number;
}

export interface ProcessGroupState {
  order: number;
  processId: number | null;
  processName: string | null;
  processGroupId: number | null;
  processGroupName: string | null;
  stepsTotal: number;
  stepsDone: number;
  isComplete: boolean;
  isBlocked: boolean;
  /** Qué procesos anteriores faltan, ya formateado: "Corte (1/2)". */
  blockedBy: string | null;
  /**
   * El agregado del proceso: la suma sobre las prendas que cubre. Lo calcula
   * el backend -- partir la cuenta entre dos capas es como acaban
   * discrepando la cabecera y el detalle.
   */
  progress: ProcessProgress;
  /** Una entrada por prenda que el proceso cubre. */
  itemProgress: ProcessItemProgress[];
  steps: ProcessServiceStep[];
}

/** Ítem de la orden, para el selector de cada paso. */
export interface ProductionOrderItemOption extends ProductionItemSizeParts {
  id: number;
  /** Si la prenda ya pasó todos sus procesos y se puede ingresar a stock. */
  routeDone: boolean;
  /** «título · sku», como lo da el backend. Para pintar, usar los de abajo. */
  name: string;
  quantity: number;
  /** Talla y color ya unidos: «S / Azul». Null si la variación no tiene términos. */
  variationTerms: string | null;
  sku: string | null;
}

/** Un servicio de la orden con su secuencia de pasos. */
export interface ServiceProcesses {
  supplierServiceId: number;
  serviceCode: string | null;
  serviceDescription: string;
  /**
   * De qué cotización sale. Es por donde se agrupa la Orden de Servicio: el
   * papel es uno por cotización, con todos sus servicios.
   */
  supplierQuotationId: number | null;
  quotationCode: string | null;
  quotationDescription: string;
  /** Las notas de la cotización: las Observaciones del papel. */
  quotationNotes: string | null;
  /**
   * La fecha pactada con el taller, la que se pone al cotizar. Se corrige
   * desde «Configurar ruta» y se lee en el Plan Maestro.
   */
  promisedDate: string | null;
  /** Moneda pactada (ISO) y condición de pago, de la cotización del servicio. */
  currency: string | null;
  paymentTerms: string | null;
  /** La fecha de la cotización. Es la que va como F. emisión en el papel. */
  quotationCreatedAt: string | null;
  /**
   * Con qué mover el avance desde esta misma pantalla. Sin `situationRowId`
   * no hay fila a la que bajarle `last_row`, y el avance no se puede lanzar.
   */
  moduleId: number;
  situationId: number | null;
  situationName: string;
  situationRowId: number | null;
  quantity: number | null;
  /** Lo pedido segun la orden. Ultima red del sembrado del dialogo. */
  requestedQuantity: number | null;
  /**
   * Lo que ENTRA en este servicio: lo que salio bueno del proceso anterior, o
   * lo que pide la orden en el primero. Es con lo que abre el dialogo de
   * avance, y se puede corregir ahi.
   */
  incomingQuantity: number | null;
  /**
   * Cierto cuando un proceso POSTERIOR de su orden ya avanzó: la prenda pasó
   * de etapa y volver atrás movería stock y costo en sentido contrario. Lo
   * calcula el backend, que además lo impide al escribir -- esto solo sirve
   * para no ofrecer un botón que va a fallar.
   */
  isLocked: boolean;
  badQuantity: number | null;
  price: number | null;
  measurementUnit: string | null;
  materialId: number | null;
  materialMeasurementUnit: string | null;
  /** El proveedor que hace el proceso. Destinatario de su guía de remisión. */
  supplierId: number | null;
  supplierName: string | null;
  supplierDocumentType: string | null;
  supplierDocumentNumber: string | null;
  supplierAddress: string | null;
  supplierPhone: string | null;
  steps: ProcessStep[];
}

export interface ProductionOrderProcesses {
  productionOrderId: number;
  productionOrderName: string;
  /** Opciones del selector de ítem. */
  items: ProductionOrderItemOption[];
  services: ServiceProcesses[];
  /** Jerarquía real: proceso arriba, sus servicios dentro. */
  processes: ProcessGroupState[];
}

/** Fila tal como la espera el SP al guardar. */
export interface ProcessStepPayload {
  /**
   * Ausente en los pasos nuevos. El SP hace diff por este id: los pasos
   * que lo traen se actualizan en el sitio conservándolo. Si no se
   * mandara, cada guardado los daría por eliminados y recreados, y con
   * ellos se perdería el ítem asignado a cada uno.
   */
  id?: number;
  /**
   * Null mientras el paso no tenga servicio: la ruta se arma antes de cotizar
   * y el proceso guarda su sitio. Al crear la cotización desde ese proceso,
   * `sp_create_supplier_service` rellena este hueco en vez de añadir un paso
   * paralelo.
   *
   * Lo que el backend sí exige es que el paso diga qué proceso es: sin
   * servicio y sin proceso la fila no dice nada.
   */
  supplier_service_id: number | null;
  /** El backend reemplaza la lista entera del paso con esto. */
  production_order_item_ids: number[];
  process_id: number | null;
  process_group_id: number | null;
  order: number;
}
