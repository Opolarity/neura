import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCreateSendMovement } from "../hooks/useCreateSendMovement";
import SendSummary from "../components/send-movement/SendSummary";
import CRequestProductSearch from "../components/create-movement-request/CRequestProductSearch";
import SendProductTable from "../components/send-movement/SendProductTable";
import { PageLoader } from "@/shared/components/page-loader";

const CreateSendMovement = () => {
  const {
    loadingInitial,
    loadingProducts,
    submitting,
    userSummary,
    warehouses,
    selectedWarehouse,
    reason,
    setReason,
    situations,
    selectedSituationCode,
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
    handleSituationChange,
    onSelectProduct,
    addProduct,
    removeProduct,
    handleQuantityChange,
    handleSearchChange,
    handlePageChange,
    sendMovement,
  } = useCreateSendMovement();

  if (loadingInitial) {
    return (
      <div className="relative w-full h-[80vh]">
        <PageLoader message="Cargando datos de envío del inventario...." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Enviar Inventario
        </h1>
        <div className="flex gap-3">
          <Link to="/inventory/movement-requests">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={sendMovement} disabled={submitting}>
            {submitting ? "Enviando..." : "Crear Envío"}
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <SendSummary
          userName={`${userSummary?.account_name || ""} ${userSummary?.account_last_name || ""} ${userSummary?.account_last_name2 || ""}`}
          userWarehouseName={userSummary?.warehouse_name || ""}
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouse?.id.toString()}
          reason={reason}
          statusName={statusName}
          situations={situations}
          selectedSituationCode={selectedSituationCode || undefined}
          onWarehouseChange={handleWarehouseChange}
          onReasonChange={setReason}
          onSituationChange={handleSituationChange}
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
            <p className="text-xs italic text-muted-foreground -mt-3">
              El inventario mostrado corresponde a tu almacén <span className="font-medium text-foreground">{userSummary?.warehouse_name}</span>
            </p>

            <SendProductTable
              products={selectedProducts}
              myWarehouseName={userSummary?.warehouse_name || ""}
              destWarehouseName={selectedWarehouse?.name || ""}
              onQuantityChange={handleQuantityChange}
              onRemoveProduct={removeProduct}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default CreateSendMovement;