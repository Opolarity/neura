import { PaginationState } from "@/shared/components/pagination/Pagination";

export interface MaterialMovementsApiResponse {
  movementsdata: {
    data: Array<{
      movement_id: number;
      date: string;
      material_id: number;
      material_name: string;
      measurement_unit: string | null;
      material_class_name: string | null;
      quantity: number;
      warehouse_id: number;
      warehouse: string;
      movement_type: string;
      movement_type_code: string | null;
      stock_type: string;
      user: string | null;
      completed: boolean;
      vinc_id: number | null;
      supplier_service_id: number | null;
      production_order_id: number | null;
      origin_kind: "supplier_service" | "production_order" | "service_dispatch" | null;
      origin_label: string | null;
    }>;
    page: { page: number; size: number; total: number };
  };
}

export interface MaterialMovement {
  movementId: number;
  date: string;
  materialId: number;
  materialName: string;
  measurementUnit: string;
  materialClassName: string;
  /** El signo es la dirección: positivo entra, negativo sale. */
  quantity: number;
  warehouseId: number;
  warehouse: string;
  movementType: string;
  movementTypeCode: string;
  stockType: string;
  user: string;
  completed: boolean;
  vinculatedMovementId: number | null;
  supplierServiceId: number | null;
  productionOrderId: number | null;
  /**
   * De dónde salió el movimiento. `null` en los manuales, que no vienen de
   * ningún sitio — y eso también es información.
   */
  originKind: "supplier_service" | "production_order" | "service_dispatch" | null;
  originLabel: string | null;
}

export interface MaterialMovementsFilters {
  page?: number;
  size?: number;
  search?: string | null;
  material_id?: number | null;
  material_class_id?: number | null;
  warehouse_id?: number | null;
  stock_type_id?: number | null;
  movement_type_id?: number | null;
  /** Día civil de Lima, "YYYY-MM-DD". El SP lo resuelve con AT TIME ZONE. */
  start_date?: string | null;
  end_date?: string | null;
  user?: string | null;
  /** null = todos · true = solo entradas · false = solo salidas. */
  in_out?: boolean | null;
  order?: string | null;
}

// ---- Detalle -------------------------------------------------------------

export interface MaterialMovementDetailApiResponse {
  movement: {
    id: number;
    quantity: number;
    completed: boolean;
    is_active: boolean;
    created_at: string;
    vinculated_movement_id: number | null;
    movement_type: { id: number; name: string; code: string | null } | null;
    stock_type: { id: number; name: string; code: string | null } | null;
    warehouse: { id: number; name: string } | null;
    material: {
      id: number;
      name: string;
      unit_cost: number | null;
      material_class: { id: number; name: string } | null;
      /**
       * Desde que la unidad vive en el catalogo (`types` del modulo MAT), el
       * embed devuelve el registro, no un texto.
       */
      measurement_unit: { id: number; code: string; name: string } | null;
    } | null;
    supplier_service: {
      id: number;
      description: string | null;
      code: string | null;
      quotation: { id: number; code: string | null; supplier_id: number | null } | null;
    } | null;
    production_order: { id: number; name: string; description: string | null } | null;
    supplier_quotation_id?: number | null;
    /** La cotizacion del envio a taller (MAT-SND), cuando lo es. */
    dispatch_quotation?: { id: number; code: string | null } | null;
    created_by_profile: {
      user_name: string | null;
      account: { name: string | null; last_name: string | null; last_name2: string | null } | null;
    } | null;
  };
}

export interface MaterialMovementDetail {
  id: number;
  quantity: number;
  completed: boolean;
  createdAt: string;
  vinculatedMovementId: number | null;
  /**
   * La cotizacion a la que se envio el material, cuando el movimiento es un
   * envio a taller (MAT-SND). Es lo que habilita imprimir su guia de remision.
   */
  supplierQuotationId: number | null;
  supplierQuotationCode: string | null;
  movementType: string;
  stockType: string;
  warehouse: string;
  materialName: string;
  measurementUnit: string;
  materialClassName: string;
  unitCost: number | null;
  user: string;
  /**
   * De dónde vino el movimiento. En productos esto sale de tablas puente;
   * aquí son dos columnas del propio movimiento, así que a lo sumo hay un
   * origen y nunca los dos a la vez.
   */
  origin:
    | {
        kind: "supplier_service";
        id: number;
        label: string;
        /**
         * La cotización de la que cuelga el servicio, que es a donde se puede
         * ir: la pantalla de Servicios se retiró y un servicio suelto ya no
         * tiene ruta propia. `null` deja el origen como texto.
         */
        quotationId: number | null;
      }
    | { kind: "production_order"; id: number; label: string }
    | null;
}

export interface MaterialMovementsResult {
  data: MaterialMovement[];
  pagination: PaginationState;
}
