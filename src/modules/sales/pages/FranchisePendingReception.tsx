import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useFranchisePendingReception } from "../hooks/useFranchisePendingReception";
import FranchisePendingHeader from "../components/franchise-pending/FranchisePendingHeader";
import FranchisePendingSummary from "../components/franchise-pending/FranchisePendingSummary";
import FranchisePendingFilterBar from "../components/franchise-pending/FranchisePendingFilterBar";
import FranchisePendingTable from "../components/franchise-pending/FranchisePendingTable";
import FranchisePendingItemsModal from "../components/franchise-pending/FranchisePendingItemsModal";

/**
 * Pendientes de aceptar (/sales/products/franchise/pending) — T-782.
 *
 * Consignaciones enviadas a franquiciados con líneas que todavía no
 * recepcionan en su inventario. Ventas ve de un vistazo qué franquiciado tiene
 * mercadería por aceptar y, al abrir un pedido, qué productos le faltan.
 * Solo lectura.
 */
const FranchisePendingReception = () => {
  const {
    rows,
    summary,
    franchiseeOptions,
    getStoreName,
    loading,
    pagination,
    filters,
    search,
    onSearchChange,
    onOnlyPendingChange,
    onAccountIdsChange,
    onPageChange,
    onPageSizeChange,
    selectedRow,
    onOpenOrder,
    onCloseOrder,
    items,
    loadingItems,
  } = useFranchisePendingReception();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <FranchisePendingHeader />

      <FranchisePendingSummary summary={summary} loading={loading} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <FranchisePendingFilterBar
            onlyPending={filters.onlyPending}
            onOnlyPendingChange={onOnlyPendingChange}
            franchiseeOptions={franchiseeOptions}
            accountIds={filters.accountIds}
            onAccountIdsChange={onAccountIdsChange}
            search={search}
            onSearchChange={onSearchChange}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <FranchisePendingTable
            rows={rows}
            loading={loading}
            onlyPending={filters.onlyPending}
            getStoreName={getStoreName}
            onOpenOrder={onOpenOrder}
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

      <FranchisePendingItemsModal
        row={selectedRow}
        storeName={
          selectedRow ? getStoreName(selectedRow.accountId, selectedRow.franchiseName) : ""
        }
        items={items}
        loading={loadingItems}
        onClose={onCloseOrder}
      />
    </div>
  );
};

export default FranchisePendingReception;
