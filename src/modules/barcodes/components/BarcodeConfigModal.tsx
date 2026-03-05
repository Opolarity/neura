import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  VariationOption,
  StockMovementOption,
  PriceListOption,
} from "../types/Barcodes.types";
import StockMovementSearcher from "./StockMovementSearcher";
import ProductVariationSearcher from "./ProductVariationSearcher";

interface BarcodeConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceLists: PriceListOption[];
  selectedVariation: VariationOption | null;
  selectedMovement: StockMovementOption | null;
  selectedPriceListId: number | null;
  sequence: number;
  quantities: number;
  price: number | null;
  loading: boolean;
  initialLoading: boolean;
  productLocked: boolean;
  onVariationChange: (variation: VariationOption) => void;
  onProductClear: () => void;
  onStockMovementChange: (movement: StockMovementOption | null) => void;
  onPriceListChange: (id: number) => void;
  onQuantitiesChange: (qty: number) => void;
  onSequenceChange: (seq: number) => void;
  onSubmit: () => void;
}

const BarcodeConfigModal = ({
  open,
  onOpenChange,
  priceLists,
  selectedVariation,
  selectedMovement,
  selectedPriceListId,
  sequence,
  quantities,
  price,
  loading,
  initialLoading,
  productLocked,
  onVariationChange,
  onProductClear,
  onStockMovementChange,
  onPriceListChange,
  onQuantitiesChange,
  onSequenceChange,
  onSubmit,
}: BarcodeConfigModalProps) => {
  const isValid =
    selectedVariation !== null &&
    selectedPriceListId !== null &&
    quantities > 0 &&
    price !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar Código de Barras</DialogTitle>
        </DialogHeader>

        {initialLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando datos...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. Movimiento de Stock (opcional, primero) */}
            <StockMovementSearcher
              selectedMovement={selectedMovement}
              onSelect={onStockMovementChange}
            />

            {/* 2. Producto / Variación */}
            <ProductVariationSearcher
              selectedVariation={selectedVariation}
              onSelect={onVariationChange}
              onClear={onProductClear}
              disabled={productLocked}
            />

            {/* 3. Lista de Precio */}
            <div className="space-y-2">
              <Label htmlFor="priceList">Lista de Precio *</Label>
              <Select
                value={selectedPriceListId?.toString() ?? ""}
                onValueChange={(val) => onPriceListChange(Number(val))}
              >
                <SelectTrigger id="priceList">
                  <SelectValue placeholder="Selecciona lista de precio" />
                </SelectTrigger>
                <SelectContent>
                  {priceLists.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id.toString()}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {price !== null && (
                <p className="text-sm text-muted-foreground">
                  Precio: S/.{price.toFixed(2)}
                </p>
              )}
            </div>

            {/* 4. Lote (editable) */}
            <div className="space-y-2">
              <Label htmlFor="sequence">Lote</Label>
              <Input
                id="sequence"
                type="number"
                min={1}
                value={sequence}
                onChange={(e) => onSequenceChange(Number(e.target.value))}
              />
            </div>

            {/* 5. Cantidad */}
            <div className="space-y-2">
              <Label htmlFor="quantities">Cantidad *</Label>
              <Input
                id="quantities"
                type="number"
                min={1}
                value={quantities}
                onChange={(e) => onQuantitiesChange(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!isValid || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeConfigModal;
