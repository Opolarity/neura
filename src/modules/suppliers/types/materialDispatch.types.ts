/** Un servicio de la cotización, tal como lo lista el backend. */
export interface ProductionOrderServiceOption {
  supplierServiceId: number;
  code: string | null;
  description: string;
  processName: string | null;
  situation: string | null;
  stepOrder: number;
}

/**
 * Una cotización de la orden elegida, con sus servicios.
 *
 * Es lo que agrupa los servicios bajo un proveedor: la tela se manda a la
 * cotización, y solo a un servicio concreto cuando de verdad es para uno.
 */
export interface ProductionOrderQuotationOption {
  supplierQuotationId: number;
  code: string | null;
  description: string;
  supplierId: number;
  supplierName: string | null;
  services: ProductionOrderServiceOption[];
}

/** Un almacén del proveedor, a donde entra la tela. */
export interface SupplierWarehouseOption {
  warehouseId: number;
  name: string;
  address: string | null;
}

/**
 * Dónde hay stock de un material. El almacén de destino entra en la lista a
 * propósito, marcado: verlo ahí es lo que explica que se proponga menos.
 */
export interface MaterialDispatchSource {
  warehouseId: number;
  warehouseName: string;
  supplierId: number | null;
  supplierName: string | null;
  owner: "mine" | "supplier";
  isDestination: boolean;
  stock: number;
}

/** Un material del plan: cuánto hace falta y cuánto de eso ya está puesto. */
export interface MaterialDispatchPlanRow {
  materialId: number;
  /** El plan va por VARIACIÓN: el Negro y el Blanco se envían por separado. */
  materialVariationId: number;
  materialName: string;
  measurementUnit: string;
  /** Lo que consumen las prendas que cubre el servicio elegido. */
  required: number;
  /** Lo que el almacén de destino ya tiene de un envío anterior. */
  alreadyAtDestination: number;
  /** La diferencia. Nunca negativa, y nunca un límite: es una propuesta. */
  suggested: number;
  sources: MaterialDispatchSource[];
}

export interface MaterialDispatchPlan {
  /** Cuántas prendas entran en la cuenta. Explica un requerimiento parcial. */
  itemsCovered: number;
  materials: MaterialDispatchPlanRow[];
}

/** Una línea del envío: el material y cuánto sale. */
export interface MaterialDispatchLine {
  /** Identidad de la línea: `v<variación>`. */
  lineKey: string;
  materialId: number;
  /** La variación que sale. */
  materialVariationId: number | null;
  materialName: string;
  measurementUnit: string;
  /**
   * Lo que hay en el almacén de ORIGEN elegido, tipo PRD: el tope de la línea.
   * Se recalcula al cambiar de origen, sin volver a preguntar al servidor.
   */
  stock: number;
  /**
   * El saldo del material en cada almacén, para poder cambiar de origen sin
   * una llamada por cambio. Los que no aparecen están en cero.
   */
  stockByWarehouse: Record<number, number>;
  /**
   * Lo que consume la receta. `null` en un material agregado a mano, que no
   * está en ninguna: no es lo mismo que necesitar cero.
   */
  required: number | null;
  alreadyAtDestination: number;
  /** Lo que se propuso al sembrarla. `null` en las agregadas a mano. */
  suggested: number | null;
  /** Dónde más hay ese material. Vacío en las agregadas a mano. */
  sources: MaterialDispatchSource[];
  /** Si nació del plan o la agregó alguien. Manda al resembrar. */
  fromPlan: boolean;
  /** null = todavía sin cantidad, que no es lo mismo que cero. */
  quantity: number | null;
}

export interface CreateMaterialDispatchPayload {
  production_order_id: number;
  supplier_quotation_id: number;
  /** Opcional: sin él, el envío es para todos los servicios de la cotización. */
  supplier_service_id?: number | null;
  /** Opcional: sin él, el backend usa el almacén del usuario. */
  warehouse_id?: number | null;
  /** El almacén del proveedor donde entra la tela. */
  destination_warehouse_id: number;
  items: Array<{ material_id: number; material_variation_id?: number | null; quantity: number }>;
}

/** La guía de remisión de un envío, tal como la arma el backend. */
export interface MaterialDispatchGuide {
  guideNumber: string;
  sentAt: string;
  orderCode: string | null;
  orderName: string | null;
  quotationCode: string | null;
  quotationDescription: string | null;
  serviceLabel: string | null;
  supplierName: string | null;
  supplierDocumentType: string | null;
  supplierDocumentNumber: string | null;
  supplierAddress: string | null;
  userName: string | null;
  originWarehouse: { name: string | null; address: string | null } | null;
  destinationWarehouse: { name: string | null; address: string | null } | null;
  items: Array<{
    materialName: string;
    materialClass: string | null;
    measurementUnit: string | null;
    quantity: number;
  }>;
}
