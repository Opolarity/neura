import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { usePriceRules } from "../hooks/usePriceRules";
import { PriceRulesHeader } from "../components/price-rules/PriceRulesHeader";
import { PriceRulesFilterBar } from "../components/price-rules/PriceRulesFilterBar";
import { PriceRulesTable } from "../components/price-rules/PriceRulesTable";
import { PriceRuleDeleteDialog } from "../components/price-rules/PriceRuleDeleteDialog";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import {
  DeselectConfirmDialog,
  SelectedCount,
  useDeselectGuard,
} from "@/shared/components/selection-guard";

const PriceRulesPage = () => {
  const navigate = useNavigate();
  const {
    rules,
    loading,
    filters,
    pagination,
    deleteDialogOpen,
    selectedRule,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onFilterChange,
    openDeleteDialog,
    setDeleteDialogOpen,
    handleDelete,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    openBulkDeleteDialog,
    handleBulkDelete,
    isBulkDeleting,
    selectedIds,
    bulkStatus,
    setBulkStatus,
    isApplyingBulk,
    toggleSelectAll,
    toggleSelectRow,
    clearSelection,
    applyBulkStatus,
  } = usePriceRules();

  // Buscar o filtrar con líneas seleccionadas pide confirmación y
  // deselecciona; paginar conserva la selección.
  const { guard, dialogProps: deselectDialogProps } = useDeselectGuard();
  const guardSelection = (action: () => void) =>
    guard(selectedIds.size, clearSelection, action);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <PriceRulesHeader
        onNewRule={() => navigate("/discounts/price-rules/create")}
        selectedCount={selectedIds.size}
        bulkStatus={bulkStatus}
        onBulkStatusChange={setBulkStatus}
        onApplyBulkStatus={applyBulkStatus}
        isApplying={isApplyingBulk}
        onBulkDelete={openBulkDeleteDialog}
        isBulkDeleting={isBulkDeleting}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4 space-y-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <PriceRulesFilterBar
              filters={filters}
              onSearchChange={(search) =>
                guardSelection(() => onSearchChange(search))
              }
              onFilterChange={(key, value) =>
                guardSelection(() => onFilterChange(key, value))
              }
            />
          </div>
          <SelectedCount count={selectedIds.size} />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <PriceRulesTable
            rules={rules}
            loading={loading}
            onDelete={openDeleteDialog}
            selectedIds={selectedIds}
            onToggleAll={toggleSelectAll}
            onToggleRow={toggleSelectRow}
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

      <PriceRuleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        rule={selectedRule}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <PriceRuleDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        count={selectedIds.size}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />

      <DeselectConfirmDialog {...deselectDialogProps} />
    </div>
  );
};

export default PriceRulesPage;
