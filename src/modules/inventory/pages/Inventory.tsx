import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <InventoryHeader
        handleEdit={handleEdit}
        isEditing={isEditing}
        handleCancel={handleCancel}
        handleSave={handleSave}
        hasChanges={hasChanges}
        isSaving={isSaving}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <InventoryFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <InventoryTable
            inventory={inventory}
            warehouses={warehouses}
            loading={loading}
            isEditing={isEditing}
            getStockValue={getStockValue}
            handleStockChange={handleStockChange}
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