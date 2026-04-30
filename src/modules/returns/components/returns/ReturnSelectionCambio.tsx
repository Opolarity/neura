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
    formatCurrency: (amount: number) => string;
    isReadOnly?: boolean;
    embeddedMode?: boolean;
}

export const ReturnSelectionCambio = ({
    exchangeProducts,
    returnProducts,
    onAddExchangeProduct,
    onUpdateProduct,
    onRemoveProduct,
    formatCurrency,
    isReadOnly = false,
    embeddedMode = false,
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

    const content = (
        <div className="space-y-4">
            {!isReadOnly && <div className="flex gap-2">
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
            </div>}

            <ExchangeProductsTable
                exchangeProducts={exchangeProducts}
                returnProducts={returnProducts}
                onUpdateProduct={onUpdateProduct}
                onRemoveProduct={onRemoveProduct}
                formatCurrency={formatCurrency}
                isReadOnly={isReadOnly}
            />
        </div>
    );

    if (embeddedMode) return content;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Productos de Cambio (Salida)</CardTitle>
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
};
