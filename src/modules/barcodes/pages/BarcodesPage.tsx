import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useBarcodes } from "../hooks/useBarcodes";
import BarcodeConfigModal from "../components/BarcodeConfigModal";
import BarcodeListTable from "../components/BarcodeListTable";

const BarcodesPage = () => {
  const {
    variations,
    stockMovements,
    priceLists,
    barcodeList,
    selectedVariationId,
    selectedStockMovementId,
    selectedPriceListId,
    sequence,
    quantities,
    price,
    loading,
    initialLoading,
    listLoading,
    modalOpen,
    setSelectedStockMovementId,
    setQuantities,
    setModalOpen,
    handleVariationChange,
    handlePriceListChange,
    handleSubmit,
    handleNewBarcode,
    handleReprint,
  } = useBarcodes();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Código de Barras</h1>
          <p className="text-muted-foreground">
            Genera e imprime etiquetas de código de barras para tus productos
          </p>
        </div>
        <Button onClick={handleNewBarcode}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Código
        </Button>
      </div>

      <BarcodeListTable
        items={barcodeList}
        loading={listLoading}
        onReprint={handleReprint}
      />

      <BarcodeConfigModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        variations={variations}
        stockMovements={stockMovements}
        priceLists={priceLists}
        selectedVariationId={selectedVariationId}
        selectedStockMovementId={selectedStockMovementId}
        selectedPriceListId={selectedPriceListId}
        sequence={sequence}
        quantities={quantities}
        price={price}
        loading={loading}
        initialLoading={initialLoading}
        onVariationChange={handleVariationChange}
        onStockMovementChange={setSelectedStockMovementId}
        onPriceListChange={handlePriceListChange}
        onQuantitiesChange={setQuantities}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default BarcodesPage;
