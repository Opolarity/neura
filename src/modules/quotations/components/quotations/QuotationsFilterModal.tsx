import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuotationsFilters } from "../../types/Quotations.types";

type AppliedFilters = Pick<QuotationsFilters, "order">;

interface QuotationsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AppliedFilters) => void;
  filters: QuotationsFilters;
}

/**
 * Los filtros de Cotizaciones, en un pop-up como los de Órdenes de producción
 * (neura-styles). En personalizado todas las cotizaciones son externas (a un
 * proveedor), así que no hay tipo ni «para quién»: solo el orden.
 */
export const QuotationsFilterModal = ({
  isOpen,
  onClose,
  onApply,
  filters,
}: QuotationsFilterModalProps) => {
  const [local, setLocal] = useState<AppliedFilters>({ order: filters.order });

  useEffect(() => {
    setLocal({ order: filters.order });
  }, [filters.order]);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleClear = () => {
    setLocal({ order: "created_at_desc" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Cotizaciones</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="quotations-order">Orden</Label>
                <Select value={local.order} onValueChange={(value) => setLocal({ order: value })}>
                  <SelectTrigger id="quotations-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at_desc">Más reciente primero</SelectItem>
                    <SelectItem value="created_at_asc">Más antiguo primero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Limpiar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
