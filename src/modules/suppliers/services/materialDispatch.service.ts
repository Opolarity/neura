import { supabase } from "@/integrations/supabase/client";
import {
  CreateMaterialDispatchPayload,
  MaterialDispatchGuide,
  MaterialDispatchPlan,
  ProductionOrderQuotationOption,
  SupplierWarehouseOption,
} from "../types/materialDispatch.types";

/**
 * `rpc` sin los tipos generados: los SPs son nuevos y no están en ellos. Se
 * acota a la forma exacta que se usa en vez de tirar de `any`.
 */
type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};
const plano = supabase as unknown as RpcClient;

type Row = Record<string, unknown>;

const str = (value: unknown): string | null =>
  value === null || value === undefined ? null : String(value);

/**
 * Las cotizaciones de una orden, con sus servicios, para elegir a cuál se
 * manda el material. RPC directo: lectura acotada por el tenant del JWT en
 * el propio SP.
 */
export const productionOrderQuotationOptionsApi = async (
  productionOrderId: number
): Promise<ProductionOrderQuotationOption[]> => {
  const { data, error } = await plano.rpc(
    "sp_get_production_order_quotation_options",
    { p_production_order_id: productionOrderId }
  );

  if (error) throw error;

  return ((data ?? []) as Row[]).map((row) => ({
    supplierQuotationId: Number(row.supplier_quotation_id),
    code: str(row.code),
    description: str(row.description) ?? "",
    supplierId: Number(row.supplier_id),
    supplierName: str(row.supplier_name),
    services: ((row.services ?? []) as Row[]).map((s) => ({
      supplierServiceId: Number(s.supplier_service_id),
      code: str(s.code),
      description: str(s.description) ?? "",
      processName: str(s.process_name),
      situation: str(s.situation),
      stepOrder: Number(s.step_order ?? 0),
    })),
  }));
};

/**
 * Qué mandarle al taller: por material, lo que consumen las prendas que cubre
 * el servicio, lo que el almacén de destino ya tiene, la diferencia sugerida y
 * dónde más hay stock.
 *
 * Sin destino elegido se puede pedir igual: entonces no descuenta nada y la
 * sugerencia es el consumo entero, que es lo correcto — no se puede descontar
 * de un almacén que todavía no se ha dicho cuál es.
 */
export const materialDispatchPlanApi = async (
  productionOrderId: number,
  supplierQuotationId: number | null,
  supplierServiceId: number | null,
  destinationWarehouseId: number | null
): Promise<MaterialDispatchPlan> => {
  const { data, error } = await plano.rpc("sp_get_material_dispatch_plan", {
    p_production_order_id: productionOrderId,
    p_supplier_quotation_id: supplierQuotationId,
    p_supplier_service_id: supplierServiceId,
    p_destination_warehouse_id: destinationWarehouseId,
  });

  if (error) throw error;

  const row = (data ?? {}) as Row;

  return {
    itemsCovered: Number(row.items_covered ?? 0),
    materials: ((row.materials ?? []) as Row[]).map((m) => ({
      materialId: Number(m.material_id),
      materialVariationId: Number(m.material_variation_id),
      materialName: str(m.material_name) ?? "",
      measurementUnit: str(m.measurement_unit) ?? "",
      required: Number(m.required ?? 0),
      alreadyAtDestination: Number(m.already_at_destination ?? 0),
      suggested: Number(m.suggested ?? 0),
      sources: ((m.sources ?? []) as Row[]).map((source) => ({
        warehouseId: Number(source.warehouse_id),
        warehouseName: str(source.warehouse_name) ?? "",
        supplierId: source.supplier_id === null ? null : Number(source.supplier_id),
        supplierName: str(source.supplier_name),
        owner: source.owner === "supplier" ? "supplier" : "mine",
        isDestination: source.is_destination === true,
        stock: Number(source.stock ?? 0),
      })),
    })),
  };
};

/** Los almacenes de un proveedor: a dónde entra la tela. */
export const supplierWarehouseOptionsApi = async (
  supplierId: number
): Promise<SupplierWarehouseOption[]> => {
  const { data, error } = await plano.rpc("sp_get_supplier_warehouse_options", {
    p_supplier_id: supplierId,
  });

  if (error) throw error;

  return ((data ?? []) as Row[]).map((row) => ({
    warehouseId: Number(row.warehouse_id),
    name: str(row.name) ?? "",
    address: str(row.address),
  }));
};

/**
 * Registrar el envío. Todo o nada: si una línea no tiene stock, el backend
 * rechaza el envío entero y no queda ningún apunte a medias.
 */
export const createMaterialDispatchApi = async (
  payload: CreateMaterialDispatchPayload
): Promise<number[]> => {
  const { data, error } = await supabase.functions.invoke(
    "create-material-service-dispatch",
    { method: "POST", body: payload }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return (data?.data?.movement_ids ?? []).map(Number);
};

/**
 * La guía de remisión de un envío, a partir de cualquiera de sus apuntes.
 * Null si el movimiento no es un envío a taller.
 */
export const materialDispatchGuideApi = async (
  movementId: number
): Promise<MaterialDispatchGuide | null> => {
  const { data, error } = await plano.rpc("sp_get_material_dispatch_guide", {
    p_movement_id: movementId,
  });

  if (error) throw error;
  if (!data) return null;

  const row = data as Row;
  const place = (value: unknown) => {
    const p = value as Row | null;
    return p ? { name: str(p.name), address: str(p.address) } : null;
  };

  return {
    guideNumber: str(row.guide_number) ?? "",
    sentAt: str(row.sent_at) ?? "",
    orderCode: str(row.order_code),
    orderName: str(row.order_name),
    quotationCode: str(row.quotation_code),
    quotationDescription: str(row.quotation_description),
    serviceLabel: str(row.service_label),
    supplierName: str(row.supplier_name),
    supplierDocumentType: str(row.supplier_document_type),
    supplierDocumentNumber: str(row.supplier_document_number),
    supplierAddress: str(row.supplier_address),
    userName: str(row.user_name),
    originWarehouse: place(row.origin_warehouse),
    destinationWarehouse: place(row.destination_warehouse),
    items: ((row.items ?? []) as Row[]).map((item) => ({
      materialName: str(item.material_name) ?? "",
      materialClass: str(item.material_class),
      measurementUnit: str(item.measurement_unit),
      quantity: Number(item.quantity ?? 0),
    })),
  };
};
