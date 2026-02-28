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

interface BarcodeConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variations: VariationOption[];
  stockMovements: StockMovementOption[];
  priceLists: PriceListOption[];
  selectedVariationId: number | null;
  selectedStockMovementId: number | null;
  selectedPriceListId: number | null;
  sequence: number;
  quantities: number;
  price: number | null;
  loading: boolean;
  initialLoading: boolean;
  onVariationChange: (id: number) => void;
  onStockMovementChange: (id: number | null) => void;
  onPriceListChange: (id: number) => void;
  onQuantitiesChange: (qty: number) => void;
  onSubmit: () => void;
}

const BarcodeConfigModal = ({
  open,
  onOpenChange,
  variations,
  stockMovements,
  priceLists,
  selectedVariationId,
  selectedStockMovementId,
  selectedPriceListId,
  sequence,
  quantities,
  price,
  loading,
  initialLoading,
  onVariationChange,
  onStockMovementChange,
  onPriceListChange,
  onQuantitiesChange,
  onSubmit,
}: BarcodeConfigModalProps) => {
  const isValid =
    selectedVariationId !== null &&
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
            {/* Producto / Variación */}
            <div className="space-y-2">
              <Label htmlFor="variation">Producto *</Label>
              <Select
                value={selectedVariationId?.toString() ?? ""}
                onValueChange={(val) => onVariationChange(Number(val))}
              >
                <SelectTrigger id="variation">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {variations.map((v) => (
                    <SelectItem key={v.variationId} value={v.variationId.toString()}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Movimiento de Stock */}
            <div className="space-y-2">
              <Label htmlFor="stockMovement">Movimiento de Stock (opcional)</Label>
              <Select
                value={selectedStockMovementId?.toString() ?? "none"}
                onValueChange={(val) =>
                  onStockMovementChange(val === "none" ? null : Number(val))
                }
              >
                <SelectTrigger id="stockMovement">
                  <SelectValue placeholder="Sin movimiento" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Sin movimiento</SelectItem>
                  {stockMovements.map((sm) => (
                    <SelectItem key={sm.id} value={sm.id.toString()}>
                      {sm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de Precio */}
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

            {/* Lote (auto) */}
            <div className="space-y-2">
              <Label htmlFor="sequence">Lote</Label>
              <Input
                id="sequence"
                type="number"
                value={sequence}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            {/* Cantidad */}
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
