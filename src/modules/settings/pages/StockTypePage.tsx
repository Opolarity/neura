import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useStockType } from "../hooks/useStockType";
import { StockTypeFormDialog } from "../components/stock-type/StockTypeFormDialog";
import StockTypeTable from "../components/stock-type/StockTypeTable";
import { ComponentPermission } from "@/shared/components/component-permission";

const StockTypePage = () => {
  const {
    stockTypes,
    editingItem,
    loading,
    openFormModal,
    saving,
    pagination,
    handleEditItemChange,
    saveStockType,
    handleOpenChange,
    handlePageChange,
    handlePageSizeChange,
  } = useStockType();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Stock</h1>
          <p className="text-muted-foreground mt-2">
            Administra los tipos de stock del sistema
          </p>
        </div>
        {/* Aquí no hay ruta de creación que reutilizar: el alta se hace en el
            mismo listado, abriendo StockTypeFormDialog en blanco. */}
        <ComponentPermission codeIn={["stock_types.create"]}>
          <Button
            className="gap-2"
            onClick={() => {
              handleEditItemChange(null);
              handleOpenChange(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Crear Tipo de Stock
          </Button>
        </ComponentPermission>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <StockTypeTable
            loading={loading}
            stockTypes={stockTypes}
            onEditItem={handleEditItemChange}
            onOpenChange={handleOpenChange}
          />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <StockTypeFormDialog
        key={editingItem?.id ?? "new"}
        open={openFormModal}
        item={editingItem}
        saving={saving}
        onSaved={saveStockType}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

export default StockTypePage;
