import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  getMovementsTypesByModule,
  getSaleProducts,
  getUserWarehouse,
} from "../services/Movements.service";
import CMovementTypeModal from "../components/create-movements/CMovementTypeModal";
import CMovementSummary from "../components/create-movements/CMovementSummary";
import CMovementSelectProducts from "../components/create-movements/CMovementSelectProducts";
import CMovementTable from "../components/create-movements/CMovementTable";
import { Link } from "react-router-dom";
import { getUserWarehouseAdapter } from "../adapters/Movements.adapter";
import { ProductSalesFilter } from "../types/Movements.types";
import { useCreateMovements } from "../hooks/useCreateMovements";
import CMovementSelectProductTypes from "../components/create-movements/CMovementSelectProductTypes";
import { Plus } from "lucide-react";

const CreateMovement = () => {
  const {
    loadingInitial,
    loadingProducts,
    movementType,
    movementTypes,
    userSummary,
    isOpen,
    products,
    productStatusTypes,
    productStatusType,
    selectedProducts,
    filters,
    selectedProduct,
    selectedIds,
    search,
    pagination,
    handleMovementType,
    handleTypeSalesProduct,
    handleQuantitySelectedProduct,
    handleSelectedProductStock,
    setIsOpen,
    handleSearchChange,
    handlePageChange,
    addProduct,
    onSelectProduct,
    sendMovement
  } = useCreateMovements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Crear Movimiento
        </h1>
        <div className="flex gap-3">
          <Link to="/inventory/movements">
            <Button variant="outline">Cancelar</Button>
          </Link>

          <Button onClick={sendMovement} form="movement-form">
            Crear
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <CMovementSummary
          currentDate={new Date().toISOString().split("T")[0]}
          userName={`${userSummary?.account_name} ${userSummary?.account_last_name} ${userSummary?.account_last_name2}`}
          warehouseName={userSummary?.warehouse_name}
          movementType={movementType?.name}
        />

        <div className="flex flex-row gap-2">
          <CMovementSelectProductTypes
            productStatusTypes={productStatusTypes}
            productStatusType={productStatusType?.id}
            onTypeStock={handleTypeSalesProduct}
          />

          <CMovementSelectProducts
            movementType={productStatusType}
            products={products}
            isLoading={loadingProducts}
            search={search}
            onSearchChange={handleSearchChange}
            pagination={pagination}
            onPageChange={handlePageChange}
            selectedIds={selectedIds}
            selectedProduct={selectedProduct}
            onSelectProduct={onSelectProduct}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />

          <Button type="button" onClick={addProduct} disabled={!selectedProduct}>
            <Plus className="w-4 h-4 mr-2" /> Agregar
          </Button>
        </div>


        <CMovementTable
          movementType={movementType}
          products={selectedProducts}
          productStatusTypes={productStatusTypes}
          onQuantityChange={handleQuantitySelectedProduct}
          onSelectedProductStock={handleSelectedProductStock}
        />

      </Card>

      <CMovementTypeModal
        types={movementTypes}
        onTypeStock={handleMovementType}
      />
    </div>
  );
};

export default CreateMovement;
