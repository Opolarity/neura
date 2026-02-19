import { useMemo } from "react";
import { Plus } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CMovementSelectProductTypes from "@/modules/inventory/components/create-movements/CMovementSelectProductTypes";
import CMovementSelectProducts from "@/modules/inventory/components/create-movements/CMovementSelectProducts";
import { ExchangeProductsTable } from "./ExchangeProductsTable";
import { useReturnSelectionCambio } from "../../hooks/useReturnSelectionCambio";
import { ExchangeProduct, ReturnProduct } from "../../types/Returns.types";

interface ReturnSelectionCambioProps {
    exchangeProducts: ExchangeProduct[];
    returnProducts: ReturnProduct[];
    onAddExchangeProduct: (product: any) => void;
    onUpdateProduct: (index: number, field: string, value: any) => void;
    onRemoveProduct: (index: number) => void;
    calculateReturnTotal: () => number;
    calculateExchangeTotal: () => number;
    calculateDifference: () => number;
    formatCurrency: (amount: number) => string;
}

export const ReturnSelectionCambio = ({
    exchangeProducts,
    returnProducts,
    onAddExchangeProduct,
    onUpdateProduct,
    onRemoveProduct,
    calculateReturnTotal,
    calculateExchangeTotal,
    calculateDifference,
    formatCurrency,
}: ReturnSelectionCambioProps) => {
    const {
        productStatusTypes,
        productStatusType,
        products,
        loadingProducts,
        isOpen,
        setIsOpen,
        selectedProduct,
        search,
        pagination,
        handleTypeChange,
        handleSearchChange,
        handlePageChange,
        handleSelectProduct,
        resetSelection,
    } = useReturnSelectionCambio();

    const selectedIds = useMemo(
        () =>
            new Set(
                exchangeProducts.map(
                    (p) => `${p.variation_id}-${productStatusType?.id ?? 0}`,
                ),
            ),
        [exchangeProducts, productStatusType],
    );

    const handleAdd = () => {
        if (!selectedProduct) return;
        onAddExchangeProduct(selectedProduct);
        resetSelection();
    };

    const difference = calculateDifference();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Productos de Cambio (Salida)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <CMovementSelectProductTypes
                        productStatusTypes={productStatusTypes}
                        productStatusType={productStatusType?.id}
                        onTypeStock={handleTypeChange}
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
                        onSelectProduct={handleSelectProduct}
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                    />
                    <Button
                        type="button"
                        onClick={handleAdd}
                        disabled={!selectedProduct}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar
                    </Button>
                </div>

                <ExchangeProductsTable
                    exchangeProducts={exchangeProducts}
                    returnProducts={returnProducts}
                    onUpdateProduct={onUpdateProduct}
                    onRemoveProduct={onRemoveProduct}
                    formatCurrency={formatCurrency}
                />

                <div className="mt-4 space-y-2 text-right border-t pt-4">
                    <p>Total Productos Devueltos: {formatCurrency(calculateReturnTotal())}</p>
                    <p>Total Productos Cambio: {formatCurrency(calculateExchangeTotal())}</p>
                    <p className="text-lg font-bold">
                        {difference >= 0
                            ? `A Reembolsar: ${formatCurrency(difference)}`
                            : `Diferencia a Pagar: ${formatCurrency(Math.abs(difference))}`}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
