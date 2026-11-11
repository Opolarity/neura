import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  SupplierPayablesApiResponse,
  SupplierPayablesResult,
  SupplierPaymentsApiResponse,
  SupplierPaymentsResult,
} from "../types/supplierPayments.types";

/** Los importes llegan como `numeric`, que PostgREST serializa como texto. */
const num = (value: number | string | null | undefined): number =>
  value === null || value === undefined ? 0 : Number(value);

/** Como `num`, pero sin dato es null y no 0: «no se sabe» no es «ninguna». */
const numOrNull = (value: number | string | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

export const supplierPaymentsAdapter = (
  response: SupplierPaymentsApiResponse,
): SupplierPaymentsResult => {
  const raw = response.paymentsdata;

  const data = (raw?.data ?? []).map((item) => ({
    serviceId: item.service_id,
    serviceCode: item.service_code ?? "",
    serviceDescription: item.service_description ?? "",
    quotationId: item.supplier_quotation_id,
    quotationCode: item.quotation_code ?? "",
    quotationDescription: item.quotation_description ?? "",
    supplierId: item.supplier_id ?? null,
    supplierName: item.supplier_name ?? "—",
    payable: num(item.payable),
    paid: num(item.paid),
    balance: num(item.balance),
    status: item.status,
    productionOrders: item.production_orders ?? null,
    requestedQuantity: numOrNull(item.requested_quantity),
    goodQuantity: numOrNull(item.good_quantity),
    badQuantity: numOrNull(item.bad_quantity),
    situationName: item.situation_name ?? null,
    receivedOn: item.received_on ?? null,
    isMaterial: item.is_material ?? false,
  }));

  const pagination: PaginationState = {
    p_page: raw?.page?.page ?? 1,
    p_size: raw?.page?.size ?? 20,
    total: raw?.page?.total ?? 0,
  };

  return {
    data,
    pagination,
    totals: {
      payable: num(raw?.totals?.payable),
      paid: num(raw?.totals?.paid),
      balance: num(raw?.totals?.balance),
    },
  };
};

export const supplierPayablesAdapter = (
  response: SupplierPayablesApiResponse,
): SupplierPayablesResult => {
  const raw = response.payablesdata;

  return {
    data: (raw?.data ?? []).map((item) => ({
      supplierId: item.supplier_id ?? null,
      supplierName: item.supplier_name ?? "—",
      services: num(item.services),
      pendingServices: num(item.pending_services),
      productionOrders: num(item.production_orders),
      productionOrderId: item.production_order_id ?? null,
      productionOrderCode: item.production_order_code ?? null,
      productionOrderName: item.production_order_name ?? null,
      payable: num(item.payable),
      paid: num(item.paid),
      balance: num(item.balance),
      oldestPendingOn: item.oldest_pending_on ?? null,
      status: item.status,
    })),
    pagination: {
      p_page: raw?.page?.page ?? 1,
      p_size: raw?.page?.size ?? 20,
      total: raw?.page?.total ?? 0,
    },
    totals: {
      payable: num(raw?.totals?.payable),
      paid: num(raw?.totals?.paid),
      balance: num(raw?.totals?.balance),
    },
  };
};
