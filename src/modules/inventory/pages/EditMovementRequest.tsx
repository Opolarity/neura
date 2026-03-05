import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEditMovementRequest } from "../hooks/useEditMovementRequest";
import CRequestSummary from "../components/create-movement-request/CRequestSummary";
import CRequestProductTable from "../components/create-movement-request/CRequestProductTable";
import RequestSituationsHistory from "../components/edit-movement-request/RequestSituationsHistory";

const EditMovementRequest = () => {
  const {
    requestId,
    loadingInitial,
    loadingProducts,
    userSummary,
    warehouses,
    selectedWarehouse,
    reason,
    setReason,
    situationName,
    statusName,
    situationsHistory,
    situationOptions,
    submittingNewSituation,
    generateNotes,
    submitNewSituation,
    quantitiesChanged,
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
    filteredSituationOptions,
  } = useEditMovementRequest();

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Cargando solicitud...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Editar Solicitud #{requestId}
        </h1>
        <div className="flex gap-3">
          <Link to="/inventory/movement-requests">
            <Button variant="outline">Volver</Button>
          </Link>
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
          isEditMode
        />

        {selectedWarehouse && (
          <>
            <CRequestProductTable
              products={selectedProducts}
              sourceWarehouseName={selectedWarehouse?.name || ""}
              myWarehouseName={userSummary?.warehouse_name || ""}
              onQuantityChange={handleQuantityChange}
              onRemoveProduct={removeProduct}
            />

            <RequestSituationsHistory
              situations={situationsHistory}
              situationOptions={filteredSituationOptions}
              generatedNotes={generateNotes()}
              onSubmitNewSituation={submitNewSituation}
              submitting={submittingNewSituation}
              quantitiesChanged={quantitiesChanged}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default EditMovementRequest;
