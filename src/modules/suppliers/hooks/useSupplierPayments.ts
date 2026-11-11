import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { getPaymentMethodsIsActiveTrueAndActiveTrue } from "@/shared/services/service";
import { errorMessageOf } from "@/shared/utils/functionError";
import {
  addSupplierPaymentApi,
  addSupplierPaymentsBulkApi,
  getSupplierPayablesByOrderApi,
  getSupplierPaymentsApi,
  uploadSupplierPaymentVoucherApi,
} from "../services/supplierPayments.service";
import {
  supplierPayablesAdapter,
  supplierPaymentsAdapter,
} from "../adapters/supplierPayments.adapter";
import {
  AddSupplierPaymentPayload,
  SupplierPayableRow,
  SupplierPayablesFilters,
  SupplierPaymentRow,
  SupplierPaymentsTotals,
} from "../types/supplierPayments.types";

/** Un método de pago con la cuenta que tenga detrás, si tiene alguna. */
export interface PaymentMethodOption {
  id: number;
  name: string;
  businessAccountId: number | null;
  businessAccountName: string | null;
}

/** El detalle de una fila (taller × OP): sus servicios, en el pop-up del ojo. */
export interface PayableDetail {
  row: SupplierPayableRow;
  loading: boolean;
  services: SupplierPaymentRow[];
}

/** Cuántos servicios se piden de un taller al desplegarlo o saldarlo. */
const SERVICIOS_POR_TALLER = 200;

/**
 * Pagos a proveedores, por TALLER y OP (2026-10-19).
 *
 * Una fila por taller y OP con lo que se le debe; el ojo abre sus servicios
 * exigibles con cómo sale cada importe. Se paga un servicio (también a medias)
 * desde el detalle, o el saldo entero de esa OP de una vez.
 */
export const useSupplierPayments = () => {
  const [rows, setRows] = useState<SupplierPayableRow[]>([]);
  const [totals, setTotals] = useState<SupplierPaymentsTotals>({
    payable: 0,
    paid: 0,
    balance: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  // Por defecto, lo que falta pagar: es a lo que se viene a esta pantalla.
  const [filters, setFilters] = useState<SupplierPayablesFilters>({
    page: 1,
    size: 20,
    search: null,
    status: "OPEN",
  });

  /** La fila cuyo detalle de servicios está abierto. */
  const [detail, setDetail] = useState<PayableDetail | null>(null);

  /** El servicio que se está pagando. `null` = el diálogo está cerrado. */
  const [payTarget, setPayTarget] = useState<SupplierPaymentRow | null>(null);
  /** Lo que se salda de una vez (el saldo de un taller). `null` = cerrado. */
  const [bulkRows, setBulkRows] = useState<SupplierPaymentRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  /** Los servicios de un taller con el filtro de estado de la lista. */
  const fetchServicios = async (
    supplierId: number | null,
    status: SupplierPayablesFilters["status"],
    search: string | null,
  ) =>
    supplierPaymentsAdapter(
      await getSupplierPaymentsApi({
        supplier_id: supplierId,
        status: status ?? null,
        search,
        page: 1,
        size: SERVICIOS_POR_TALLER,
      }),
    ).data.filter((row) => row.supplierId === supplierId);

  /** Los servicios de una fila: los del taller que son de esa OP. */
  const serviciosDeFila = async (
    row: SupplierPayableRow,
    status: SupplierPayablesFilters["status"],
    search: string | null,
  ) =>
    (await fetchServicios(row.supplierId, status, search)).filter(
      (servicio) => (servicio.productionOrders ?? null) === row.productionOrderCode,
    );

  const loadRows = async (currentFilters: SupplierPayablesFilters = filters) => {
    setLoading(true);
    try {
      const adapted = supplierPayablesAdapter(await getSupplierPayablesByOrderApi(currentFilters));
      setRows(adapted.data);
      setPagination(adapted.pagination);
      setTotals(adapted.totals);
      // El detalle abierto se relee (tras un pago), para que diga lo mismo que
      // la fila.
      if (detail) {
        const fila =
          adapted.data.find(
            (row) => row.supplierId === detail.row.supplierId && row.productionOrderId === detail.row.productionOrderId,
          ) ?? detail.row;
        setDetail({
          row: fila,
          loading: false,
          services: await serviciosDeFila(fila, currentFilters.status, currentFilters.search ?? null),
        });
      }
    } catch (error) {
      console.error("Error loading supplier payables:", error);
      toast({
        title: "No se pudieron cargar los pagos a proveedores",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const methods = await getPaymentMethodsIsActiveTrueAndActiveTrue();
        setPaymentMethods(
          (methods ?? []).map((method) => ({
            id: method.id,
            name: method.name ?? "",
            businessAccountId: method.business_account_id ?? null,
            businessAccountName: method.business_accounts?.name ?? null,
          })),
        );
      } catch (error) {
        console.error("Error loading payment methods:", error);
      }
      await loadRows(filters);
    };
    void init();
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (patch: Partial<SupplierPayablesFilters>) => {
    const next = { ...filters, ...patch, page: patch.page ?? 1 };
    setFilters(next);
    void loadRows(next);
  };

  const onSearch = (value: string) => applyFilters({ search: value.trim() || null });
  const onStatusChange = (status: SupplierPayablesFilters["status"]) => applyFilters({ status });
  const onPageChange = (page: number) => applyFilters({ page });
  const onPageSizeChange = (size: number) => applyFilters({ size, page: 1 });

  /** El ojo: los servicios de la fila (taller × OP) en un pop-up. */
  const openDetail = async (row: SupplierPayableRow) => {
    setDetail({ row, loading: true, services: [] });
    try {
      const services = await serviciosDeFila(row, filters.status, filters.search ?? null);
      setDetail({ row, loading: false, services });
    } catch (error) {
      setDetail(null);
      toast({
        title: "No se pudieron cargar los servicios",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    }
  };
  const closeDetail = () => setDetail(null);

  const onOpenPay = (row: SupplierPaymentRow) => setPayTarget(row);
  const onClosePay = () => setPayTarget(null);

  const onSubmitPay = async (payload: AddSupplierPaymentPayload, voucher?: File | null) => {
    setSaving(true);
    try {
      // Primero el comprobante: el pago necesita su url.
      const voucherUrl = voucher
        ? await uploadSupplierPaymentVoucherApi(payload.supplierQuotationId, voucher)
        : (payload.voucherUrl ?? null);

      await addSupplierPaymentApi({ ...payload, voucherUrl });
      toast({ title: "Pago registrado", variant: "success" });
      setPayTarget(null);
      await loadRows(filters);
    } catch (error) {
      console.error("Error adding supplier payment:", error);
      // El SP dice por qué: pagar de más, sin saldo, o de otra cotización.
      toast({
        title: "No se pudo registrar el pago",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Pagar el saldo de una fila: los servicios con saldo del taller en esa OP, enteros. */
  const onPaySupplier = async (row: SupplierPayableRow) => {
    try {
      const pendientes = (await serviciosDeFila(row, "OPEN", null)).filter((servicio) => servicio.balance > 0);
      if (pendientes.length === 0) {
        toast({ title: "No hay saldo pendiente en esta OP" });
        return;
      }
      setBulkRows(pendientes);
    } catch (error) {
      toast({
        title: "No se pudieron cargar los servicios del taller",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    }
  };

  const onCloseBulk = () => setBulkRows(null);
  const bulkTotal = (bulkRows ?? []).reduce((sum, row) => sum + row.balance, 0);

  /**
   * Salda el lote: cada servicio por TODO su saldo, en una sola transacción.
   * Para pagar a medias está el diálogo de un servicio.
   */
  const onSubmitBulk = async (
    paymentMethodId: number,
    businessAccountId: number,
    description: string | null,
    voucher?: File | null,
  ) => {
    if (!bulkRows || bulkRows.length === 0) return;
    setSaving(true);
    try {
      const voucherUrl = voucher
        ? await uploadSupplierPaymentVoucherApi(bulkRows[0].quotationId, voucher)
        : null;

      await addSupplierPaymentsBulkApi({
        payments: bulkRows.map((row) => ({
          supplierQuotationId: row.quotationId,
          supplierServiceId: row.serviceId,
          amount: row.balance,
        })),
        paymentMethodId,
        businessAccountId,
        description,
        voucherUrl,
      });
      toast({
        title: bulkRows.length === 1 ? "Pago registrado" : `${bulkRows.length} pagos registrados`,
        variant: "success",
      });
      setBulkRows(null);
      await loadRows(filters);
    } catch (error) {
      console.error("Error adding supplier payments in bulk:", error);
      // Va en una transacción: si falla, no entró ninguno.
      toast({
        title: "No se registró ningún pago",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    rows,
    totals,
    paymentMethods,
    loading,
    pagination,
    filters,
    detail,
    openDetail,
    closeDetail,
    payTarget,
    bulkRows,
    bulkTotal,
    saving,
    onSearch,
    onStatusChange,
    onPageChange,
    onPageSizeChange,
    onOpenPay,
    onClosePay,
    onSubmitPay,
    onPaySupplier,
    onCloseBulk,
    onSubmitBulk,
  };
};
