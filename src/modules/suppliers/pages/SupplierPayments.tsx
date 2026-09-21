import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useSupplierPayments } from "../hooks/useSupplierPayments";
import SupplierPaymentsHeader from "../components/supplier-payments/SupplierPaymentsHeader";
import SupplierPaymentsFilterBar from "../components/supplier-payments/SupplierPaymentsFilterBar";
import SupplierPaymentsTable from "../components/supplier-payments/SupplierPaymentsTable";
import SupplierPaymentDialog from "../components/supplier-payments/SupplierPaymentDialog";
import SupplierPaymentsBulkBar from "../components/supplier-payments/SupplierPaymentsBulkBar";
import SupplierPaymentsBulkDialog from "../components/supplier-payments/SupplierPaymentsBulkDialog";

const SupplierPayments = () => {
  const {
    rows,
    totals,
    suppliers,
    paymentMethods,
    loading,
    search,
    pagination,
    filters,
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
  } = useSupplierPayments();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <SupplierPaymentsHeader totals={totals} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <SupplierPaymentsFilterBar
            search={search}
            onSearchChange={onSearchChange}
            suppliers={suppliers}
            filters={filters}
            onSupplierChange={onSupplierChange}
            onStatusChange={onStatusChange}
          />

          {/* Debajo de los filtros y solo con algo marcado: es una barra de
              acción, no un filtro más. */}
          <SupplierPaymentsBulkBar
            count={selectedRows.length}
            total={selectedTotal}
            onClear={onClearSelection}
            onPay={onOpenBulk}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
          <SupplierPaymentsTable
            rows={rows}
            loading={loading}
            onPay={onOpenPay}
            selectedIds={selectedIds}
            allSelected={allSelected}
            onToggleRow={onToggleRow}
            onToggleAll={onToggleAll}
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

      <SupplierPaymentDialog
        target={payTarget}
        paymentMethods={paymentMethods}
        saving={saving}
        onClose={onClosePay}
        onSubmit={onSubmitPay}
      />

      <SupplierPaymentsBulkDialog
        open={bulkOpen}
        rows={selectedRows}
        total={selectedTotal}
        paymentMethods={paymentMethods}
        saving={saving}
        onClose={onCloseBulk}
        onSubmit={onSubmitBulk}
      />
    </div>
  );
};

export default SupplierPayments;
