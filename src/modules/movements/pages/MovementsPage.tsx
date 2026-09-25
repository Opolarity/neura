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
import {
  DeselectConfirmDialog,
  SelectedCount,
  useDeselectGuard,
} from "@/shared/components/selection-guard";

const MovementsPage = () => {
  const {
    movements,
    pagination,
    loading,
    error,

    search,
    filters,
    isOpenFilterModal,
    hasActiveFilters,

    movementTypes,
    categories,
    paymentMethods,
    businessAccounts,
    salesChannels,

    selectedMovements,
    clearSelection,

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

  // Buscar, ordenar o filtrar con líneas seleccionadas pide confirmación y
  // deselecciona; paginar conserva la selección.
  const { guard, dialogProps: deselectDialogProps } = useDeselectGuard();
  const guardSelection = (action: () => void) =>
    guard(selectedMovements.length, clearSelection, action);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <MovementsHeader
        onAddExpense={goToAddExpense}
        onAddIncome={goToAddIncome}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4 space-y-0 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <MovementsFilterBar
            search={search}
            onSearchChange={(value) =>
              guardSelection(() => onSearchChange(value))
            }
            onOpenFilterModal={onOpenFilterModal}
            order={filters.order}
            onOrderChange={(order) =>
              guardSelection(() => onOrderChange(order))
            }
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => guardSelection(onClearFilters)}
          />
          <SelectedCount count={selectedMovements.length} />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
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

        <CardFooter className="!p-0">
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
        salesChannels={salesChannels}
        onClose={onCloseFilterModal}
        onApply={(newFilters) =>
          guardSelection(() => onApplyFilter(newFilters))
        }
      />

      <DeselectConfirmDialog {...deselectDialogProps} />
    </div>
  );
};

export default MovementsPage;
