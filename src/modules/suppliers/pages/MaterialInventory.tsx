import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useMaterialInventory } from "../hooks/useMaterialInventory";
import MaterialInventoryHeader from "../components/material-inventory/MaterialInventoryHeader";
import MaterialInventoryFilterBar from "../components/material-inventory/MaterialInventoryFilterBar";
import MaterialInventoryFilterModal from "../components/material-inventory/MaterialInventoryFilterModal";
import MaterialInventoryTable from "../components/material-inventory/MaterialInventoryTable";

/**
 * Dónde está la materia prima.
 *
 * Misma forma que la lista de inventario de productos: una fila por material y
 * una columna por almacén. Almacén materiales responde «cuánto tengo» sumando
 * todos los almacenes; con los de taller esa suma mezcla lo que está en casa
 * con lo que ya se mandó, y son decisiones opuestas: lo primero se envía, lo
 * segundo ya está puesto.
 */
const MaterialInventory = () => {
  const {
    rows,
    columns,
    isEditing,
    isSaving,
    hasChanges,
    getStockValue,
    handleStockChange,
    handleEdit,
    handleCancel,
    handleSave,
    warehouses,
    suppliers,
    stockTypes,
    loading,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    hasActiveFilters,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onOrderChange,
    onPageChange,
    onPageSizeChange,
  } = useMaterialInventory();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <MaterialInventoryHeader
        isEditing={isEditing}
        isSaving={isSaving}
        hasChanges={hasChanges}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleSave}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <MaterialInventoryFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <MaterialInventoryTable
            rows={rows}
            columns={columns}
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
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <MaterialInventoryFilterModal
        filters={filters}
        warehouses={warehouses}
        suppliers={suppliers}
        stockTypes={stockTypes}
        isOpen={isOpenFilterModal}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
    </div>
  );
};

export default MaterialInventory;
