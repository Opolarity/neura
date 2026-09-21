import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { getPaymentMethodsIsActiveTrueAndActiveTrue } from "@/shared/services/service";
import { errorMessageOf } from "@/shared/utils/functionError";
import { suppliersListApi } from "../services/suppliers.service";
import { Supplier } from "../types/suppliers.types";
import {
  addSupplierPaymentApi,
  addSupplierPaymentsBulkApi,
  getSupplierPaymentsApi,
  uploadSupplierPaymentVoucherApi,
} from "../services/supplierPayments.service";
import { supplierPaymentsAdapter } from "../adapters/supplierPayments.adapter";
import {
  AddSupplierPaymentPayload,
  SupplierPaymentRow,
  SupplierPaymentsFilters,
  SupplierPaymentsTotals,
} from "../types/supplierPayments.types";

/** Un método de pago con la cuenta que tenga detrás, si tiene alguna. */
export interface PaymentMethodOption {
  id: number;
  name: string;
  businessAccountId: number | null;
  businessAccountName: string | null;
}

export const useSupplierPayments = () => {
  const [rows, setRows] = useState<SupplierPaymentRow[]>([]);
  const [totals, setTotals] = useState<SupplierPaymentsTotals>({
    payable: 0,
    paid: 0,
    balance: 0,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<SupplierPaymentsFilters>({
    page: 1,
    size: 20,
    search: null,
    supplier_id: null,
    status: null,
  });

  /** El servicio que se está pagando. `null` = el diálogo está cerrado. */
  const [payTarget, setPayTarget] = useState<SupplierPaymentRow | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Los servicios marcados para saldar juntos, por id.
   *
   * Se guardan los ids y no las filas: la lista se recarga tras cada pago y
   * una fila guardada quedaría con el saldo viejo. Lo que se paga se resuelve
   * contra `rows` en el momento de abrir el diálogo.
   */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  /** El lote está abierto en el diálogo. */
  const [bulkOpen, setBulkOpen] = useState(false);

  const { toast } = useToast();

  const loadRows = async (currentFilters: SupplierPaymentsFilters = filters) => {
    setLoading(true);
    try {
      const response = await getSupplierPaymentsApi(currentFilters);
      const adapted = supplierPaymentsAdapter(response);
      setRows(adapted.data);
      setPagination(adapted.pagination);
      setTotals(adapted.totals);
      // La selección no sobrevive a un cambio de lista: marcar en una página,
      // filtrar y pagar habría cobrado servicios que ya no se veían.
      setSelectedIds((prev) =>
        prev.filter((id) => adapted.data.some((row) => row.serviceId === id)),
      );
    } catch (error) {
      console.error("Error loading supplier payments:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos a proveedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    try {
      // Los proveedores son para el filtro; se piden de una vez porque el
      // selector tiene que poder abrirse sin ir a la red.
      const [suppliersResponse, methods] = await Promise.all([
        suppliersListApi({ page: 1, size: 500 }),
        getPaymentMethodsIsActiveTrueAndActiveTrue(),
      ]);

      setSuppliers(suppliersResponse.data ?? []);
      setPaymentMethods(
        (methods ?? []).map((method) => ({
          id: method.id,
          name: method.name ?? "",
          businessAccountId: method.business_account_id ?? null,
          businessAccountName: method.business_accounts?.name ?? null,
        })),
      );

      await loadRows(filters);
    } catch (error) {
      console.error("Error loading supplier payments catalogues:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos a proveedores",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const searchTerm = debouncedSearch || null;
    if (searchTerm !== filters.search) {
      setFilters((prev) => {
        const next = { ...prev, search: searchTerm, page: 1 };
        loadRows(next);
        return next;
      });
    }
  }, [debouncedSearch]);

  const onSearchChange = (value: string) => setSearch(value);

  const onSupplierChange = (supplierId: number | null) => {
    const next = { ...filters, supplier_id: supplierId, page: 1 };
    setFilters(next);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
    loadRows(next);
  };

  const onStatusChange = (status: SupplierPaymentsFilters["status"]) => {
    const next = { ...filters, status, page: 1 };
    setFilters(next);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
    loadRows(next);
  };

  const onPageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => {
      const next = { ...prev, page };
      loadRows(next);
      return next;
    });
  };

  const onPageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => {
      const next = { ...prev, size, page: 1 };
      loadRows(next);
      return next;
    });
  };

  const onOpenPay = (row: SupplierPaymentRow) => setPayTarget(row);
  const onClosePay = () => setPayTarget(null);

  const onSubmitPay = async (
    payload: AddSupplierPaymentPayload,
    voucher?: File | null,
  ) => {
    setSaving(true);
    try {
      // Primero el comprobante: el pago necesita su url. Si el pago falla
      // después, queda un fichero suelto en el storage -- preferible a un pago
      // registrado sin comprobante.
      const voucherUrl = voucher
        ? await uploadSupplierPaymentVoucherApi(
            payload.supplierQuotationId,
            voucher,
          )
        : (payload.voucherUrl ?? null);

      await addSupplierPaymentApi({ ...payload, voucherUrl });
      toast({ title: "Pago registrado" });
      setPayTarget(null);
      await loadRows(filters);
    } catch (error) {
      console.error("Error adding supplier payment:", error);
      // El SP rechaza pagar de más, pagar sin saldo o pagar un servicio de
      // otra cotización, y su mensaje es el que sirve: decir "no se pudo
      // registrar el pago" escondería el motivo.
      toast({
        title: "No se pudo registrar el pago",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Solo se puede marcar lo que se puede pagar: un servicio saldado en el lote
  // solo serviría para que el SP lo rechazara y tumbara el resto.
  const selectableRows = rows.filter((row) => row.balance > 0);

  const selectedRows = selectableRows.filter((row) =>
    selectedIds.includes(row.serviceId),
  );

  const selectedTotal = selectedRows.reduce((sum, row) => sum + row.balance, 0);

  const allSelected =
    selectableRows.length > 0 && selectedRows.length === selectableRows.length;

  const onToggleRow = (serviceId: number, checked: boolean) =>
    setSelectedIds((prev) =>
      checked
        ? prev.includes(serviceId)
          ? prev
          : [...prev, serviceId]
        : prev.filter((id) => id !== serviceId),
    );

  const onToggleAll = (checked: boolean) =>
    setSelectedIds(checked ? selectableRows.map((row) => row.serviceId) : []);

  const onClearSelection = () => setSelectedIds([]);

  const onOpenBulk = () => setBulkOpen(true);
  const onCloseBulk = () => setBulkOpen(false);

  /**
   * Salda el lote entero: cada servicio por TODO su saldo.
   *
   * Pagar de a poco es lo que hace el diálogo de uno solo; el lote es para
   * cerrar lo que se le debe a un taller, y pedir un importe por fila lo
   * convertiría en un formulario que nadie quiere rellenar.
   */
  const onSubmitBulk = async (
    paymentMethodId: number,
    businessAccountId: number,
    description: string | null,
    voucher?: File | null,
  ) => {
    setSaving(true);
    try {
      // Uno para todo el lote: es un solo desembolso. Se cuelga de la primera
      // cotización porque el fichero tiene que vivir en algún sitio, y todas
      // las filas apuntan a la misma url.
      const voucherUrl =
        voucher && selectedRows.length > 0
          ? await uploadSupplierPaymentVoucherApi(
              selectedRows[0].quotationId,
              voucher,
            )
          : null;

      await addSupplierPaymentsBulkApi({
        payments: selectedRows.map((row) => ({
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
        title:
          selectedRows.length === 1
            ? "Pago registrado"
            : `${selectedRows.length} pagos registrados`,
      });
      setBulkOpen(false);
      setSelectedIds([]);
      await loadRows(filters);
    } catch (error) {
      console.error("Error adding supplier payments in bulk:", error);
      // El SP mete el lote entero en una transacción: si falla, no entró
      // ninguno. Decirlo evita que alguien vuelva a pagar los que "sí pasaron".
      toast({
        title: "No se registró ningún pago",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasActiveFilters =
    (filters.supplier_id ?? null) !== null || (filters.status ?? null) !== null;

  return {
    rows,
    totals,
    suppliers,
    paymentMethods,
    loading,
    search,
    pagination,
    filters,
    hasActiveFilters,
    payTarget,
    saving,
    selectedIds,
    selectedRows,
    selectedTotal,
    allSelected,
    bulkOpen,
    onToggleRow,
    onToggleAll,
    onClearSelection,
    onOpenBulk,
    onCloseBulk,
    onSubmitBulk,
    onSearchChange,
    onSupplierChange,
    onStatusChange,
    onPageChange,
    onPageSizeChange,
    onOpenPay,
    onClosePay,
    onSubmitPay,
  };
};
