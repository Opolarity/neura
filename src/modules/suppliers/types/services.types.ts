import { ServiceTab } from "@/modules/quotations/types/Quotations.types";

/** Producto que atraviesa un servicio, vía la matriz paso × prenda. */
export interface ServiceVariation {
  variationId: number;
  sku: string | null;
  productTitle: string | null;
}

/** Modelo de UI de un servicio a proveedor (tabla supplier_services). */
export interface SupplierService {
  id: number;
  description: string;
  code: string | null;
  supplierQuotationId: number;
  quotationCode: string | null;
  quotationDescription: string;
  supplierId: number;
  supplierName: string;
  /** Nullable: un servicio puede no tener material asignado. */
  materialId: number | null;
  materialName: string | null;
  /** Unidad y costo del material vinculado, si lo hay. */
  materialMeasurementUnit: string | null;
  materialUnitCost: number | null;
  supplierClassId: number;
  supplierClassName: string;
  moduleId: number;
  statusId: number;
  statusName: string;
  situationId: number;
  situationName: string;
  situationCode: string | null;
  /**
   * Fila vigente de supplier_service_situations. Sin ella no se puede avanzar
   * el servicio: es a la que hay que bajarle `last_row` antes de insertar la
   * siguiente.
   */
  situationRowId: number | null;
  /**
   * Instante de la situación vigente. Cuando la situación es la de recepción,
   * ESTA es la fecha real de entrega — `supplier_services.delivered_at` se
   * retiró justamente para no tener el dato en dos sitios.
   */
  situationAt: string | null;
  /** Día civil (Lima) que prometió el proveedor. */
  promisedDate: string | null;
  /** Lo ULTIMO registrado: tras un avance ya no es lo que se pidio. */
  quantity: number | null;
  /**
   * Lo PEDIDO. Lo calcula el backend: de la orden de produccion si el
   * servicio esta vinculado, y de lo tecleado si no. Por eso no se edita
   * cuando hay orden -- ahi el numero no vive aqui.
   */
  requestedQuantity: number | null;
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
  /** Orden de producción a la que está vinculado, si lo está. */
  productionOrderId: number | null;
  productionOrderName: string | null;
  variations: ServiceVariation[];
  createdAt: string;
}

export interface SupplierServicesFilters {
  search?: string | null;
  /**
   * Naturaleza de la línea: con material vinculado es compra, sin él es
   * maquila. Se reutiliza el tipo del módulo de cotizaciones en vez de
   * declarar otro igual — es la misma distinción.
   */
  kind?: ServiceTab | null;
  supplier_quotation_id?: number | null;
  material_id?: number | null;
  supplier_class_id?: number | null;
  situation_id?: number | null;
  /** Rango de fecha pronosticada. Días civiles de Lima, "YYYY-MM-DD". */
  promised_from?: string | null;
  promised_to?: string | null;
  variation_id?: number | null;
  page?: number;
  size?: number;
}

/** Opción del combo de producto del filtro. */
export interface VariationOption {
  id: number;
  sku: string | null;
  productTitle: string | null;
  /** Etiqueta ya compuesta por el backend. */
  label: string;
}

/** Opción del combobox de cotizaciones de proveedor. */
export interface QuotationOption {
  id: number;
  description: string;
  supplierName: string;
  /** Etiqueta ya compuesta para mostrar y buscar en el combobox. */
  label: string;
}

/** Opción del combobox de materiales. */
export interface MaterialOption {
  id: number;
  /**
   * La variación concreta ("Jersey 30/1 · Negro") cuando la opción viene del
   * buscador de variaciones; `id` sigue siendo el del material. Sin ella el
   * backend usa la única variación del material.
   */
  materialVariationId?: number | null;
  name: string;
  /** Necesarios para calcular el total en vivo de una explosión. */
  unitCost: number | null;
  measurementUnit: string | null;
  /**
   * La clase del material — TELA, AVIOS. Viaja con la opción para que la línea
   * de una receta muestre su clase en cuanto se elige el material, sin esperar
   * a guardar y recargar.
   */
  materialClassId: number | null;
  materialClassName: string | null;
}

/** Clase de proveedor (classes del módulo SPL). */
export interface SupplierClassOption {
  id: number;
  name: string;
  code?: string | null;
}

export interface UpdateSupplierServiceData {
  id: number;
  description?: string | null;
  supplier_quotation_id?: number | null;
  supplier_class_id?: number | null;
  material_id?: number | null;
  code?: string | null;
  /**
   * Desasigna el material. Hace falta un flag explícito porque un
   * material_id nulo por sí solo significa "no cambiar".
   */
  clear_material?: boolean;
  /** La fecha pactada con el taller, calendario de Lima. Vacía = no se toca. */
  promised_date?: string | null;
  /** Alta de material desde el propio servicio. */
  new_material?: {
    name: string;
    material_class_id: number;
    measurement_unit: string;
  } | null;
}
