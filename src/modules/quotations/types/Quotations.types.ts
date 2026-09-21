import { MaterialLinkValue } from "@/modules/suppliers/types/materialLink.types";
import { ProductionOrderLinkValue } from "@/modules/suppliers/types/productionOrderLink.types";

export interface QuotationListItemApi {
  id: number;
  /** El asunto: el título de la cotización. */
  subject: string;
  /** Las notas. Hasta la 202610010110 este campo era el título. */
  request_description: string | null;
  quantity: number | null;
  price: number | null;
  created_at: string;
  supplier_name: string;
  status_name: string | null;
}

export interface QuotationListItem {
  id: number;
  description: string;
  quantity: number | null;
  price: number | null;
  createdAt: string;
  supplierName: string;
  statusName: string | null;
}

export interface QuotationsFilters {
  search: string | null;
  order: string;
  page: number;
  size: number;
}

export interface QuotationsPaginationState {
  p_page: number;
  p_size: number;
  total: number;
}

export interface QuotationsApiResponse {
  data: {
    page: { page: number; size: number; total: number };
    data: QuotationListItemApi[];
  };
}

export interface QuotationSituationApi {
  id: number;
  message: string | null;
  quantity: number | null;
  bad_quantity: number | null;
  measurement_unit: string;
  price: number | null;
  status_id: number;
  situation_id: number;
  situation_name: string | null;
  situation_code: string | null;
  created_at: string;
}

/** Las dos naturalezas de una línea de cotización, y las dos pestañas. */
export type ServiceTab = "SERVICE" | "MATERIAL";

export interface QuotationServiceApi {
  id: number;
  description: string;
  supplier_class_id: number;
  module_id: number;
  material_id: number | null;
  /**
   * Derivado por el SP de `material_id` — MATERIAL si apunta a uno, SERVICE si
   * no. La columna `kind` se eliminó en 202609280001 justo para que no pudiera
   * contradecir a lo que la línea apunta, así que esto se lee, no se recalcula.
   */
  kind: ServiceTab | null;
  code: string | null;
  production_order_id: number | null;
  /**
   * Si el precio pactado ya lleva IGV. Null = sin declarar (líneas anteriores
   * al indicador).
   *
   * Vive en la LÍNEA, no en la situación vigente: una situación registra un
   * cambio de etapa, y que el precio lleve IGV no cambia porque la prenda
   * avance. Estuvo en `supplier_service_situations` hasta 202610010115.
   */
  price_includes_tax: boolean | null;
  /** Lo prometido al proveedor. El SP ya lo devolvía; faltaba declararlo. */
  promised_date: string | null;
  /**
   * Es el último servicio del recorrido de su orden de producción, o sea por
   * el que la prenda sale terminada. Lo calcula el SP comparando el paso más
   * avanzado del servicio con el de toda la orden. Los servicios sin orden
   * vinculada llegan en `true`: no tienen secuencia que respetar.
   */
  is_last_step: boolean;
  /**
   * Si la orden vinculada tiene prendas. Es lo que separa los dos flujos, y no
   * `production_order_id`: el intake de prendas compradas también crea una
   * orden, pero vacía. Con prendas, el stock entra por la orden; sin ellas,
   * por aquí. Sin orden vinculada llega en `false`.
   */
  production_order_has_items: boolean;
  /** Un proceso posterior de su orden ya avanzó: no puede cambiar de situación. */
  is_locked: boolean;
  /**
   * Lo PEDIDO, calculado por el SP: sale de la orden de producción cuando la
   * línea está vinculada, y de lo tecleado cuando no. Es distinto de
   * `last_situation.quantity`, que es lo último registrado — tras un avance
   * ese ya no es lo que se pidió.
   */
  requested_quantity: number | null;
  last_situation: QuotationSituationApi | null;
}

export interface QuotationServicesFilters {
  id: number;
  search: string | null;
  page: number;
  size: number;
  /** Naturaleza de la línea. Ausente devuelve las dos. */
  kind?: ServiceTab | null;
}


export interface QuotationServicesApiResponse {
  data: QuotationServiceApi[];
  page: { page: number; size: number; total: number };
}

export interface ServiceSituationHistoryItem {
  /**
   * La fila del avance. Es lo que permite colgarle papeles: la guía de
   * remisión sellada pertenece a UNA pierna del viaje, no al servicio entero.
   */
  id: number;
  situation_name: string;
  status_name: string;
  quantity: number | null;
  bad_quantity: number | null;
  price: number | null;
  message: string | null;
  measurement_unit: string;
  created_at: string;
  created_by_name: string;
}

export interface QuotationDetailApi {
  quotation: {
    id: number;
    /** El asunto: el título de la cotización. */
    subject: string;
    /** Las notas, opcionales. Salen en las Observaciones de los papeles. */
    request_description: string | null;
    quantity: number | null;
    price: number | null;
    created_at: string;
    code: string | null;
    digital_files: string[];
    /** Moneda pactada, código ISO. Las anteriores a este campo salen en PEN. */
    currency: string | null;
    /** Lo acordado sobre el pago. Null = no se pactó nada. */
    payment_terms: string | null;
    supplier_id: number;
    supplier_name: string;
  };
}

/** Línea de servicio dentro del editor de una cotización nueva. */
export interface QuotationServiceLine {
  description: string;
  supplierClassId: number | null;
  supplierClassName: string;
  /** Vínculo con material: sin material, o vinculado a uno existente. */
  materialLink: MaterialLinkValue;
  /** Vínculo con orden de producción: sin orden, o vinculado a una existente. */
  productionOrderLink: ProductionOrderLinkValue;
  quantity: number | null;
  /** El TOTAL de la línea, no el unitario. El unitario es esto entre cantidad. */
  price: number | null;
  /** Si ese total ya lleva IGV. Null = sin declarar. */
  priceIncludesTax: boolean | null;
  measurementUnit: string;
  /** Cuando se espera el trabajo ("YYYY-MM-DD"). */
  promisedDate?: string | null;
}

export interface QuotationServiceLinePayload {
  description: string;
  /**
   * Nula = la resuelve el backend.
   *
   * NO sale del proveedor: `supplier_classes` clasifica al proveedor, que es
   * otra cosa —hay proveedores sin ninguna clase, y alguno con «Material», que
   * sobre un servicio sería una etiqueta falsa—. El backend usa la clase que
   * este tenant ya viene poniendo a los servicios de sus órdenes.
   */
  supplier_class_id: number | null;
  material_id?: number | null;
  production_order_id?: number | null;
  code?: string | null;
  quantity?: number | null;
  price?: number | null;
  /** Si ese precio ya lleva IGV. Omitido = sin declarar. */
  price_includes_tax?: boolean | null;
  measurement_unit?: string | null;
  /** Fecha pactada con el proveedor ("YYYY-MM-DD"). */
  promised_date?: string | null;
  /**
   * El proceso de la ruta, cuando la línea nace desde uno. Con él el servicio
   * queda asignado al paso en el mismo acto, en vez de colgar suelto de la
   * orden a la espera del diálogo «Procesos».
   */
  process_id?: number | null;
  process_group_id?: number | null;
  /** La posición del proceso en la ruta. Sin ella, el backend la deduce. */
  step_order?: number | null;
  /**
   * Las prendas de la orden que van a tener servicio propio.
   *
   * Con ellas la línea crea **un servicio por prenda** dentro de la misma
   * cotización, cada uno con la cantidad de SU prenda. Vacía o ausente, crea
   * uno solo para toda la orden — que es lo que hace el resto del alta.
   */
  production_order_item_ids?: number[];
}

export interface CreateSupplierQuotationData {
  supplier_id: number;
  /** Moneda pactada, código ISO. Omitida = soles. */
  currency?: string | null;
  /** Lo acordado sobre el pago, texto libre. */
  payment_terms?: string | null;
  /** El asunto, obligatorio. */
  subject: string;
  /** Las notas, opcionales. */
  request_description?: string | null;
  code?: string | null;
  services: QuotationServiceLinePayload[];
}

export interface AddQuotationServiceData extends QuotationServiceLinePayload {
  supplier_quotation_id: number;
}

export interface CreateSupplierQuotationResult {
  id: number;
  quantity: number | null;
  price: number | null;
}

export type BulkStockEntryStatus = "will_process" | "processed" | "skipped" | "error";

export interface BulkStockEntryResult {
  supplier_service_id: number;
  status: BulkStockEntryStatus;
  missing_quantity?: number;
  variation_id?: number;
  sku?: string;
  reason?: string;
  stock_movement_id?: number;
  stock_entry_id?: number;
}

export interface BulkStockEntryResponse {
  success: boolean;
  summary: {
    total: number;
    will_process: number;
    skipped: number;
  };
  results: BulkStockEntryResult[];
}
