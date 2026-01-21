import { useState } from "react";
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
import { AttributeFilters } from "../../types/Attributes.types";

interface AttributesFilterModalProps {
  isOpen: boolean;
  filters: AttributeFilters;
  onClose: () => void;
  onApply: (filters: Partial<AttributeFilters>) => void;
  onReset: () => void;
}

export default function AttributesFilterModal({
  isOpen,
  filters,
  onClose,
  onApply,
  onReset,
}: AttributesFilterModalProps) {
  const [minProducts, setMinProducts] = useState<string>(
    filters.minProducts?.toString() || ""
  );
  const [maxProducts, setMaxProducts] = useState<string>(
    filters.maxProducts?.toString() || ""
  );

  const handleApply = () => {
    onApply({
      minProducts: minProducts ? parseInt(minProducts) : null,
      maxProducts: maxProducts ? parseInt(maxProducts) : null,
    });
  };

  const handleReset = () => {
    setMinProducts("");
    setMaxProducts("");
    onReset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Atributos</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Cantidad de Productos</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={minProducts}
                onChange={(e) => setMinProducts(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={maxProducts}
                onChange={(e) => setMaxProducts(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
