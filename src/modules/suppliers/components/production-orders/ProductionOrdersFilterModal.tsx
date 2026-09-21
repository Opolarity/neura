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
import {
  ProductionOrderClassOption,
  ProductionOrdersFilters,
  ProductionOrderType,
} from "../../types/productionOrders.types";
import {
  PRODUCTION_ORDER_TYPES,
  productionOrderTypeBadge,
} from "../../utils/productionOrderType";

const ALL = "all";

interface ProductionOrdersFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ProductionOrdersFilters) => void;
  filters: ProductionOrdersFilters;
  classes: ProductionOrderClassOption[];
}

export const ProductionOrdersFilterModal = ({
  isOpen,
  onClose,
  onApply,
  filters,
  classes,
}: ProductionOrdersFilterModalProps) => {
  const [localFilters, setLocalFilters] =
    useState<ProductionOrdersFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({
      ...localFilters,
      production_order_class_id: null,
      type: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Órdenes de producción</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno: el max-h va en un contenedor propio, no
            en el ScrollArea, que envuelve solo el cuerpo para que cabecera y footer
            queden fuera del scroll. Al ser un máximo la altura se adapta al contenido
            y el scroll solo aparece si hay de sobra, así que sirve el mismo valor en
            todos los modales de filtros. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="production-order-class">Clase de orden</Label>
                <Select
                  value={
                    localFilters.production_order_class_id
                      ? localFilters.production_order_class_id.toString()
                      : ALL
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      production_order_class_id: value === ALL ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="production-order-class">
                    <SelectValue placeholder="Seleccione clase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las clases</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="production-order-type">Tipo de orden</Label>
                <Select
                  value={localFilters.type ?? ALL}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      type: value === ALL ? null : (value as ProductionOrderType),
                    })
                  }
                >
                  <SelectTrigger id="production-order-type">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los tipos</SelectItem>
                    {PRODUCTION_ORDER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {productionOrderTypeBadge(t)?.label ?? t}
                      </SelectItem>
                    ))}
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
