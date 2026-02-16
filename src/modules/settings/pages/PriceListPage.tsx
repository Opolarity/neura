import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { usePriceList } from "../hooks/usePriceList";
import { PriceListFormDialog } from "../components/list-price/PriceListFormDialog";
import { PriceList } from "../types/PriceList.types";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import PriceListHeader from "../components/list-price/PriceListHeader";
import PriceListTable from "../components/list-price/PriceListTable";

const PriceListPage = () => {
  const {
    priceLists,
    editingItem,
    loading,
    openFormModal,
    saving,
    pagination,
    handleEditItemChange,
    savePriceList,
    deletePriceList,
    handleOpenChange,
    handlePageChange,
    handlePageSizeChange,
  } = usePriceList();

  return (
    <div className="p-6">
      <PriceListHeader
        onOpenDialog={() => {
          handleEditItemChange(null);
          handleOpenChange(true);
        }}
      />

      <Card>
        <CardContent className="p-0">
          <PriceListTable
            loading={loading}
            prices={priceLists}
            onEditItem={handleEditItemChange}
            onOpenChange={handleOpenChange}
            onDelete={deletePriceList}
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

      <PriceListFormDialog
        key={editingItem?.id ?? "new"}
        open={openFormModal}
        item={editingItem}
        saving={saving}
        onSaved={savePriceList}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

export default PriceListPage;
