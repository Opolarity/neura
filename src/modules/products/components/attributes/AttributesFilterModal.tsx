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
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const parsePositive = (raw: string) => raw.replace(/-/g, "");

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Atributos</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno, mismo patrón que el resto de
            modales de filtros. Hoy hay un solo grupo y no se acerca al tope,
            pero al ser un MÁXIMO la altura sigue al contenido: el modal no
            arrastra hueco vacío y el scroll solo aparecería si se añaden
            filtros. El max-h va en un contenedor propio, no en el ScrollArea
            (su Root lleva overflow-hidden). El pr-4 aparta el contenido de la
            barra de scroll, que si no roza el borde derecho de los inputs. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="grid gap-2">
                <Label>Cantidad de Productos</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    min={0}
                    value={minProducts}
                    onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                    onChange={(e) =>
                      setMinProducts(parsePositive(e.target.value))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Máximo"
                    min={0}
                    value={maxProducts}
                    onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                    onChange={(e) =>
                      setMaxProducts(parsePositive(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
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
