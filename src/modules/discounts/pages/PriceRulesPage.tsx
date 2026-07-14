import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePriceRules } from "../hooks/usePriceRules";
import { PriceRulesHeader } from "../components/price-rules/PriceRulesHeader";
import { PriceRulesFilterBar } from "../components/price-rules/PriceRulesFilterBar";
import { PriceRulesTable } from "../components/price-rules/PriceRulesTable";
import { PriceRuleDeleteDialog } from "../components/price-rules/PriceRuleDeleteDialog";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

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
    selectedIds,
    bulkStatus,
    setBulkStatus,
    isApplyingBulk,
    toggleSelectAll,
    toggleSelectRow,
    applyBulkStatus,
  } = usePriceRules();

  return (
    <div className="p-6 space-y-6">
      <PriceRulesHeader
        onNewRule={() => navigate("/discounts/price-rules/create")}
        selectedCount={selectedIds.size}
        bulkStatus={bulkStatus}
        onBulkStatusChange={setBulkStatus}
        onApplyBulkStatus={applyBulkStatus}
        isApplying={isApplyingBulk}
      />

      <Card>
        <CardHeader>
          <PriceRulesFilterBar
            filters={filters}
            onSearchChange={onSearchChange}
            onFilterChange={onFilterChange}
          />
        </CardHeader>
        <CardContent className="p-0">
          <PriceRulesTable
            rules={rules}
            loading={loading}
            onEdit={(rule) => navigate(`/discounts/price-rules/edit/${rule.id}`)}
            onDelete={openDeleteDialog}
            selectedIds={selectedIds}
            onToggleAll={toggleSelectAll}
            onToggleRow={toggleSelectRow}
          />
        </CardContent>
      </Card>

      <PaginationBar
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <PriceRuleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        rule={selectedRule}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default PriceRulesPage;
