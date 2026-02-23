import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useStockType } from "../hooks/useStockType";
import { StockTypeFormDialog } from "../components/stock-type/StockTypeFormDialog";
import StockTypeTable from "../components/stock-type/StockTypeTable";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Stock</h1>
          <p className="text-muted-foreground mt-2">
            Administra los tipos de stock del sistema
          </p>
        </div>
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
      </div>

      <Card>
        <CardContent className="p-0">
          <StockTypeTable
            loading={loading}
            stockTypes={stockTypes}
            onEditItem={handleEditItemChange}
            onOpenChange={handleOpenChange}
          />
        </CardContent>
        <CardFooter>
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
