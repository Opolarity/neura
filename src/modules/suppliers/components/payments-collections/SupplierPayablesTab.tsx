import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { TotalsCards } from "./TotalsCards";
import { useSupplierPayments } from "../../hooks/useSupplierPayments";
import SupplierPaymentsFilterBar from "../supplier-payments/SupplierPaymentsFilterBar";
import SupplierPayablesTable from "../supplier-payments/SupplierPayablesTable";
import SupplierPaymentDialog from "../supplier-payments/SupplierPaymentDialog";
import SupplierPaymentsBulkDialog from "../supplier-payments/SupplierPaymentsBulkDialog";
import SupplierPayableDetailDialog from "../supplier-payments/SupplierPayableDetailDialog";

/**
 * Pagos y cobros › Proveedores: lo que se le debe a cada taller por OP.
 * Qué es exigible lo decide el backend con la regla de personalizado
 * (fn_supplier_service_payable: desde «En proceso»), no la pantalla.
 */
export const SupplierPayablesTab = () => {
  const {
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
  } = useSupplierPayments();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <TotalsCards
        items={[
          // Exigible, no recibido: en personalizado el servicio se debe desde «En proceso».
          { label: "Total exigible", value: totals.payable },
          { label: "Total pagado", value: totals.paid },
          { label: "Total por pagar", value: totals.balance },
        ]}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <SupplierPaymentsFilterBar
            search={filters.search ?? null}
            status={filters.status ?? null}
            onSearch={onSearch}
            onStatusChange={onStatusChange}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <SupplierPayablesTable
            rows={rows}
            loading={loading}
            onPay={(row) => void onPaySupplier(row)}
            onView={(row) => void openDetail(row)}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>

      {/* Pagar un servicio cierra el detalle: dos pop-ups encima no. */}
      <SupplierPayableDetailDialog
        detail={detail}
        onClose={closeDetail}
        onPayService={(servicio) => {
          closeDetail();
          onOpenPay(servicio);
        }}
      />

      <SupplierPaymentDialog
        target={payTarget}
        paymentMethods={paymentMethods}
        saving={saving}
        onClose={onClosePay}
        onSubmit={onSubmitPay}
      />

      <SupplierPaymentsBulkDialog
        open={bulkRows !== null}
        rows={bulkRows ?? []}
        total={bulkTotal}
        paymentMethods={paymentMethods}
        saving={saving}
        onClose={onCloseBulk}
        onSubmit={onSubmitBulk}
      />
    </div>
  );
};

