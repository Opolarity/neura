import { useEffect, useMemo, useState } from "react";
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
  MaterialClass,
  MaterialsFilters,
  SupplierOption,
} from "../../types/materials.types";
import {
  buildMaterialClassTree,
  flattenMaterialClassTree,
} from "../../utils/materialClassTree";

const ALL = "all";

interface MaterialsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: MaterialsFilters) => void;
  filters: MaterialsFilters;
  classes: MaterialClass[];
  suppliers: SupplierOption[];
}

export const MaterialsFilterModal = ({
  isOpen,
  onClose,
  onApply,
  filters,
  classes,
  suppliers,
}: MaterialsFilterModalProps) => {
  const [localFilters, setLocalFilters] = useState<MaterialsFilters>(filters);

  // Mismo arbol que el selector de la ficha. Filtrar por una raiz trae toda su
  // rama: sp_get_materials resuelve los descendientes con un WITH RECURSIVE.
  const classTree = useMemo(
    () => flattenMaterialClassTree(buildMaterialClassTree(classes)),
    [classes]
  );

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
      material_class_id: null,
      supplier_id: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Materiales</DialogTitle>
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
                <Label htmlFor="material-class">Clase de material</Label>
                <Select
                  value={
                    localFilters.material_class_id
                      ? localFilters.material_class_id.toString()
                      : ALL
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      material_class_id: value === ALL ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="material-class">
                    <SelectValue placeholder="Seleccione clase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las clases</SelectItem>
                    {classTree.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        <span style={{ paddingLeft: `${cls.level * 12}px` }}>
                          {cls.level > 0 && (
                            <span className="mr-1 text-xs text-muted-foreground">
                              └
                            </span>
                          )}
                          {cls.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Select
                  value={
                    localFilters.supplier_id ? localFilters.supplier_id.toString() : ALL
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      supplier_id: value === ALL ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Seleccione proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los proveedores</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
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
