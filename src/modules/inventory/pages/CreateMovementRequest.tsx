import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCreateMovementRequest } from "../hooks/useCreateMovementRequest";
import CRequestSummary from "../components/create-movement-request/CRequestSummary";
import CRequestProductSearch from "../components/create-movement-request/CRequestProductSearch";
import CRequestProductTable from "../components/create-movement-request/CRequestProductTable";

const CreateMovementRequest = () => {
  const {
    loadingInitial,
    loadingProducts,
    submitting,
    userSummary,
    warehouses,
    selectedWarehouse,
    reason,
    setReason,
    situationName,
    statusName,
    isOpen,
    setIsOpen,
    products,
    selectedProduct,
    selectedProducts,
    selectedIds,
    search,
    pagination,
    handleWarehouseChange,
    onSelectProduct,
    addProduct,
    removeProduct,
    handleQuantityChange,
    handleSearchChange,
    handlePageChange,
    sendRequest,
  } = useCreateMovementRequest();

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Crear Solicitud de Movimiento
        </h1>
        <div className="flex gap-3">
          <Link to="/inventory/movements">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={sendRequest} disabled={submitting}>
            {submitting ? "Creando..." : "Crear Solicitud"}
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <CRequestSummary
          userName={`${userSummary?.account_name || ""} ${userSummary?.account_last_name || ""} ${userSummary?.account_last_name2 || ""}`}
          userWarehouseName={userSummary?.warehouse_name || ""}
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouse?.id.toString()}
          reason={reason}
          statusName={statusName}
          situationName={situationName}
          onWarehouseChange={handleWarehouseChange}
          onReasonChange={setReason}
        />

        {selectedWarehouse && (
          <>
            <div className="flex flex-row gap-2">
              <CRequestProductSearch
                products={products}
                selectedIds={selectedIds}
                selectedProduct={selectedProduct}
                isLoading={loadingProducts}
                search={search}
                pagination={pagination}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                onSearchChange={handleSearchChange}
                onPageChange={handlePageChange}
                onSelectProduct={onSelectProduct}
              />
              <Button
                type="button"
                onClick={addProduct}
                disabled={!selectedProduct}
              >
                <Plus className="w-4 h-4 mr-2" /> Agregar
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              El inventario mostrado corresponde al almacén <span className="font-medium text-foreground">{selectedWarehouse?.name}</span>
            </p>

            <CRequestProductTable
              products={selectedProducts}
              sourceWarehouseName={selectedWarehouse?.name || ""}
              myWarehouseName={userSummary?.warehouse_name || ""}
              onQuantityChange={handleQuantityChange}
              onRemoveProduct={removeProduct}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default CreateMovementRequest;
