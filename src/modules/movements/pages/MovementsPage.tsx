import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useMovements } from "../hooks/useMovements";
import MovementsHeader from "../components/movements/MovementsHeader";
import MovementsFilterBar from "../components/movements/MovementsFilterBar";
import MovementsTable from "../components/movements/MovementsTable";
import MovementsFilterModal from "../components/movements/MovementsFilterModal";

const MovementsPage = () => {
  const {
    movements,
    pagination,
    loading,
    error,

    search,
    filters,
    isOpenFilterModal,

    movementTypes,
    categories,
    paymentMethods,
    businessAccounts,

    selectedMovements,

    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onClearFilters,
    onOrderChange,
    onPageChange,
    handlePageSizeChange,
    toggleSelectAll,
    toggleMovementSelection,
    goToAddExpense,
    goToAddIncome,
    goToMovementDetail,
  } = useMovements();

  const hasActiveFilters = !!(
    filters.type ||
    filters.class ||
    filters.bussines_account ||
    filters.payment_method ||
    filters.start_date ||
    filters.end_date ||
    filters.branches
  );

  return (
    <div className="space-y-6">
      <MovementsHeader
        onAddExpense={goToAddExpense}
        onAddIncome={goToAddIncome}
      />

      <Card>
        <CardHeader>
          <MovementsFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpenFilterModal={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
          />
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <MovementsTable
              movements={movements}
              loading={loading}
              search={search}
              selectedMovements={selectedMovements}
              onToggleMovementSelection={toggleMovementSelection}
              onToggleAllMovementsSelection={toggleSelectAll}
              onGoToMovementDetail={goToMovementDetail}
            />
          )}
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <MovementsFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        movementTypes={movementTypes}
        categories={categories}
        paymentMethods={paymentMethods}
        businessAccounts={businessAccounts}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
    </div>
  );
};

export default MovementsPage;
