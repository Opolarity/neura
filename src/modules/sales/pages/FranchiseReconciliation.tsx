import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useState } from "react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useFranchiseReconciliation } from "../hooks/useFranchiseReconciliation";
import FranchiseeEntryModal from "../components/franchise-stock/FranchiseeEntryModal";
import FranchiseReconciliationHeader from "../components/franchise-reconciliation/FranchiseReconciliationHeader";
import FranchiseReconciliationSummary from "../components/franchise-reconciliation/FranchiseReconciliationSummary";
import FranchiseReconciliationFilterBar from "../components/franchise-reconciliation/FranchiseReconciliationFilterBar";
import FranchiseReconciliationTable from "../components/franchise-reconciliation/FranchiseReconciliationTable";

/**
 * Conciliación de retornos (/sales/products/franchise/reconciliation), S-297.
 *
 * Solo lectura: compara por SKU el saldo que el sistema espera que tenga un
 * franquiciado contra su stock físico. No registra conteos ni genera cobros.
 */
const FranchiseReconciliation = () => {
  const {
    franchisees,
    loadingFranchisees,
    tenantReference,
    rows,
    totals,
    categories,
    loading,
    search,
    pagination,
    filters,
    onSelectFranchisee,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onStatusChange,
    onCategoriesChange,
  } = useFranchiseReconciliation();

  const [showEntryModal, setShowEntryModal] = useState(true);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <FranchiseeEntryModal
        open={showEntryModal}
        franchisees={franchisees}
        loading={loadingFranchisees}
        onAccept={(tenant) => {
          onSelectFranchisee(tenant);
          setShowEntryModal(false);
        }}
      />

      <FranchiseReconciliationHeader />

      <FranchiseReconciliationSummary
        tenantReference={tenantReference}
        totals={totals}
        loading={loading}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <FranchiseReconciliationFilterBar
            franchisees={franchisees}
            loadingFranchisees={loadingFranchisees}
            tenantReference={tenantReference}
            onSelectFranchisee={onSelectFranchisee}
            search={search}
            onSearchChange={onSearchChange}
            status={filters.status}
            onStatusChange={onStatusChange}
            counts={totals?.counts ?? null}
            categories={categories}
            selectedCategories={filters.categories}
            onCategoriesChange={onCategoriesChange}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <FranchiseReconciliationTable
            rows={rows}
            loading={loading}
            hasFranchisee={!!tenantReference}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default FranchiseReconciliation;
