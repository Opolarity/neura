import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useBarcodes } from "../hooks/useBarcodes";
import BarcodeConfigModal from "../components/BarcodeConfigModal";
import BarcodeListTable from "../components/BarcodeListTable";
import { ComponentPermission } from "@/shared/components/component-permission";

const BarcodesPage = () => {
  const {
    priceLists,
    barcodeList,
    selectedVariation,
    selectedMovement,
    selectedPriceListId,
    sequence,
    quantities,
    price,
    labelLayout,
    loading,
    initialLoading,
    listLoading,
    modalOpen,
    productLocked,
    setQuantities,
    setSequence,
    setModalOpen,
    setLabelLayout,
    handleVariationChange,
    handleStockMovementChange,
    handleProductClear,
    handlePriceListChange,
    handleSubmit,
    handleNewBarcode,
    handleReprint,
  } = useBarcodes();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Código de Barras</h1>
          <p className="text-muted-foreground">
            Genera e imprime etiquetas de código de barras para tus productos
          </p>
        </div>
        <ComponentPermission codeIn={["barcodes.create"]}>
          <Button onClick={handleNewBarcode}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Código
          </Button>
        </ComponentPermission>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <BarcodeListTable
            items={barcodeList}
            loading={listLoading}
            onReprint={handleReprint}
          />
        </CardContent>
      </Card>

      <BarcodeConfigModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        priceLists={priceLists}
        selectedVariation={selectedVariation}
        selectedMovement={selectedMovement}
        selectedPriceListId={selectedPriceListId}
        sequence={sequence}
        quantities={quantities}
        price={price}
        labelLayout={labelLayout}
        loading={loading}
        initialLoading={initialLoading}
        productLocked={productLocked}
        onVariationChange={handleVariationChange}
        onProductClear={handleProductClear}
        onStockMovementChange={handleStockMovementChange}
        onPriceListChange={handlePriceListChange}
        onQuantitiesChange={setQuantities}
        onSequenceChange={setSequence}
        onLabelLayoutChange={setLabelLayout}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default BarcodesPage;
