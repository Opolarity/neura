import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  SupplierPaymentsApiResponse,
  SupplierPaymentsResult,
} from "../types/supplierPayments.types";

/** Los importes llegan como `numeric`, que PostgREST serializa como texto. */
const num = (value: number | string | null | undefined): number =>
  value === null || value === undefined ? 0 : Number(value);

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
