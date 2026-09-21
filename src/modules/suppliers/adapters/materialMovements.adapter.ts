import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  MaterialMovementDetail,
  MaterialMovementDetailApiResponse,
  MaterialMovementsApiResponse,
  MaterialMovementsResult,
} from "../types/materialMovements.types";

export const materialMovementsAdapter = (
  response: MaterialMovementsApiResponse,
): MaterialMovementsResult => {
  const raw = response.movementsdata;

  const data = (raw?.data ?? []).map((item) => ({
    movementId: item.movement_id,
    date: item.date,
    materialId: item.material_id,
    materialName: item.material_name ?? "",
    measurementUnit: item.measurement_unit ?? "",
    materialClassName: item.material_class_name ?? "",
    quantity: Number(item.quantity ?? 0),
    warehouseId: item.warehouse_id,
    warehouse: item.warehouse ?? "",
    movementType: item.movement_type ?? "",
    movementTypeCode: item.movement_type_code ?? "",
    stockType: item.stock_type ?? "",
    user: item.user ?? "—",
    completed: item.completed ?? true,
    vinculatedMovementId: item.vinc_id ?? null,
    supplierServiceId: item.supplier_service_id ?? null,
    productionOrderId: item.production_order_id ?? null,
    originKind: item.origin_kind ?? null,
    originLabel: item.origin_label ?? null,
  }));

  const pagination: PaginationState = {
    p_page: raw?.page?.page ?? 1,
    p_size: raw?.page?.size ?? 20,
    total: raw?.page?.total ?? 0,
  };

  return { data, pagination };
};

export const materialMovementDetailAdapter = (
  response: MaterialMovementDetailApiResponse,
): MaterialMovementDetail => {
  const { movement } = response;

  const account = movement.created_by_profile?.account;
  const fullName = [account?.name, account?.last_name, account?.last_name2]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Las dos columnas de origen son excluyentes: un movimiento viene de una
  // compra o de una orden de producción, nunca de las dos.
  const service = movement.supplier_service;
  const order = movement.production_order;

  const origin: MaterialMovementDetail["origin"] = service
    ? {
        kind: "supplier_service",
        id: service.id,
        label:
          service.description ||
          service.code ||
          `Servicio #${service.id}`,
        quotationId: service.quotation?.id ?? null,
      }
    : order
      ? {
          kind: "production_order",
          id: order.id,
          label: order.name || `Orden #${order.id}`,
        }
      : null;

  return {
    id: movement.id,
    quantity: Number(movement.quantity ?? 0),
    completed: movement.completed ?? true,
    createdAt: movement.created_at,
    vinculatedMovementId: movement.vinculated_movement_id,
    supplierQuotationId: movement.supplier_quotation_id ?? null,
    supplierQuotationCode: movement.dispatch_quotation?.code ?? null,
    movementType: movement.movement_type?.name ?? "—",
    stockType: movement.stock_type?.name ?? "—",
    warehouse: movement.warehouse?.name ?? "—",
    materialName: movement.material?.name ?? "—",
    measurementUnit: movement.material?.measurement_unit?.code ?? "",
    materialClassName: movement.material?.material_class?.name ?? "",
    unitCost:
      movement.material?.unit_cost === null ||
      movement.material?.unit_cost === undefined
        ? null
        : Number(movement.material.unit_cost),
    user: fullName || movement.created_by_profile?.user_name || "—",
    origin,
  };
};
