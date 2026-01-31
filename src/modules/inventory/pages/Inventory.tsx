import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import InventoryTable from "../components/inventory/InventoryTable";
import InventoryHeader from "../components/inventory/InventoryHeader";
import InventoryFilterBar from "../components/inventory/InventoryFilterBar";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import InventoryFilterModal from "../components/inventory/InventoryFilterModal";

const Inventory = () => {
  const {
    inventory,
    warehouses,
    inventoryTypes,
    typeId,
    loading,
    isEditing,
    isSaving,
    hasChanges,
    hasActiveFilters,
    handleStockChange,
    getStockValue,
    handleEdit,
    handleCancel,
    handleSave,
    // Filter & Pagination props
    search,
    pagination,
    isOpenFilterModal, // Available if we need it
    filters, // Available if we need it
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal, // Available if we need it
    onApplyFilter, // Available if we need it
  } = useInventory();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InventoryHeader
        handleEdit={handleEdit}
        isEditing={isEditing}
        handleCancel={handleCancel}
        handleSave={handleSave}
        hasChanges={hasChanges}
        isSaving={isSaving}
      />

      <Card>
        <CardHeader>
          <InventoryFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0">
          <InventoryTable
            inventory={inventory}
            warehouses={warehouses}
            isEditing={isEditing}
            getStockValue={getStockValue}
            handleStockChange={handleStockChange}
          />
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>
      <InventoryFilterModal
        types={inventoryTypes}
        filters={filters}
        typeId={typeId}
        isOpen={isOpenFilterModal}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
    </div>
  );
};

export default Inventory;